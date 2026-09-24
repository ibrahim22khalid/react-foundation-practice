import { render, screen, userEvent } from '@testing-library/react-native';

import { LearningCard } from '../LearningCard';

describe('LearningCard', () => {
  test('shows the visible details of an incomplete learning card', async () => {
    await render(
      <LearningCard
        title="React Native Testing"
        minutes={30}
        completed={false}
        description="Practice visible behavior"
        onAddMinutes={jest.fn()}
        onComplete={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByText('React Native Testing')).toBeOnTheScreen();
    expect(screen.getByText('30 minutes')).toBeOnTheScreen();
    expect(screen.getByText('Practice visible behavior')).toBeOnTheScreen();
    expect(screen.getByText('Not completed yet')).toBeOnTheScreen();
  });

  test('does not show a description when it is omitted', async () => {
    await render(
      <LearningCard
        title="React Native Testing"
        minutes={30}
        completed={false}
        onAddMinutes={jest.fn()}
        onComplete={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(
      screen.queryByText('Practice visible behavior'),
    ).not.toBeOnTheScreen();
  });

  test('calls onAddMinutes once when Add 5 minutes is pressed', async () => {
    const user = userEvent.setup();
    const onAddMinutes = jest.fn();

    await render(
      <LearningCard
        title="React Native Testing"
        minutes={30}
        completed={false}
        onAddMinutes={onAddMinutes}
        onComplete={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    const addMinutesButton = screen.getByRole('button', {
      name: 'Add 5 minutes',
    });

    await user.press(addMinutesButton);

    expect(onAddMinutes).toHaveBeenCalledTimes(1);
  });

  test('calls onComplete once when Mark as complete is pressed', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();

    await render(
      <LearningCard
        title="React Native Testing"
        minutes={30}
        completed={false}
        onAddMinutes={jest.fn()}
        onComplete={onComplete}
        onRemove={jest.fn()}
      />,
    );

    const completeButton = screen.getByRole('button', {
      name: 'Mark as complete',
    });

    await user.press(completeButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('calls onRemove once when Remove is pressed', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();

    await render(
      <LearningCard
        title="React Native Testing"
        minutes={30}
        completed={false}
        onAddMinutes={jest.fn()}
        onComplete={jest.fn()}
        onRemove={onRemove}
      />,
    );

    const removeButton = screen.getByRole('button', { name: 'Remove' });

    await user.press(removeButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test('shows a disabled Completed button that blocks completion', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();

    await render(
      <LearningCard
        title="React Native Testing"
        minutes={30}
        completed={true}
        onAddMinutes={jest.fn()}
        onComplete={onComplete}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByText('Lesson completed')).toBeOnTheScreen();

    const completedButton = screen.getByRole('button', {
      name: 'Completed',
    });

    expect(completedButton).toBeDisabled();

    await user.press(completedButton);

    expect(onComplete).not.toHaveBeenCalled();
  });
});

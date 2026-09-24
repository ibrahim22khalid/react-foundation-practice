import { render, screen, userEvent } from '@testing-library/react-native';

import { LearningItemForm } from '../LearningItemForm';

describe('LearningItemForm', () => {
  test('exposes its inputs with accessible labels', async () => {
    await render(<LearningItemForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Learning item title')).toBeOnTheScreen();
    expect(screen.getByLabelText('Learning item minutes')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Learning item description'),
    ).toBeOnTheScreen();
  });

  test('shows validation and does not submit an empty form', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    await render(<LearningItemForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: 'Add item' });

    await user.press(submitButton);

    expect(screen.getByText('Title is required.')).toBeOnTheScreen();
    expect(
      screen.getByText('Minutes must be a whole number.'),
    ).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows a whole-number error when minutes contain letters', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    await render(<LearningItemForm onSubmit={onSubmit} />);

    const minutesInput = screen.getByLabelText('Learning item minutes');
    const submitButton = screen.getByRole('button', { name: 'Add item' });

    await user.type(minutesInput, 'abc');
    await user.press(submitButton);

    expect(
      screen.getByText('Minutes must be a whole number.'),
    ).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits trimmed valid values and clears the fields', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    await render(<LearningItemForm onSubmit={onSubmit} />);

    const titleInput = screen.getByLabelText('Learning item title');
    const minutesInput = screen.getByLabelText('Learning item minutes');
    const descriptionInput = screen.getByLabelText(
      'Learning item description',
    );
    const submitButton = screen.getByRole('button', { name: 'Add item' });

    await user.type(titleInput, 'Draft title');
    await user.clear(titleInput);
    await user.type(titleInput, '  React Query Practice  ');
    await user.type(minutesInput, '45');
    await user.type(descriptionInput, '  Understand query caching  ');
    await user.press(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'React Query Practice',
      minutes: 45,
      description: 'Understand query caching',
    });
    expect(titleInput).toHaveDisplayValue('');
    expect(minutesInput).toHaveDisplayValue('');
    expect(descriptionInput).toHaveDisplayValue('');
  });

  test('omits the description property when it is blank', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    await render(<LearningItemForm onSubmit={onSubmit} />);

    const titleInput = screen.getByLabelText('Learning item title');
    const minutesInput = screen.getByLabelText('Learning item minutes');
    const submitButton = screen.getByRole('button', { name: 'Add item' });

    await user.type(titleInput, 'React Query Practice');
    await user.type(minutesInput, '45');
    await user.press(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'React Query Practice',
      minutes: 45,
    });
  });

  test('clears draft values without submitting when Reset is pressed', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    await render(<LearningItemForm onSubmit={onSubmit} />);

    const titleInput = screen.getByLabelText('Learning item title');
    const minutesInput = screen.getByLabelText('Learning item minutes');
    const descriptionInput = screen.getByLabelText(
      'Learning item description',
    );
    const resetButton = screen.getByRole('button', { name: 'Reset' });

    await user.type(titleInput, 'Draft title');
    await user.type(minutesInput, '25');
    await user.type(descriptionInput, 'Draft description');
    await user.press(resetButton);

    expect(titleInput).toHaveDisplayValue('');
    expect(minutesInput).toHaveDisplayValue('');
    expect(descriptionInput).toHaveDisplayValue('');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

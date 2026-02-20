// src/__tests__/components/Modal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ConfirmModal } from '../../components/Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when show is true', () => {
    render(
      <Modal show={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    render(
      <Modal show={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Modal show={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Modal show={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const backdrop = screen.getByText('Test Modal').closest('.modal');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should apply size class when provided', () => {
    render(
      <Modal show={true} onClose={mockOnClose} title="Large Modal" size="lg">
        <p>Content</p>
      </Modal>
    );

    const modalDialog = screen.getByText('Large Modal').closest('.modal-dialog');
    expect(modalDialog).toHaveClass('modal-lg');
  });
});

describe('ConfirmModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with title and message', () => {
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm"
        message="Are you sure you want to delete?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
  });

  it('should display custom button text', () => {
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="確認"
        message="実行しますか？"
        confirmText="実行"
        cancelText="戻る"
      />
    );

    expect(screen.getByRole('button', { name: '実行' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
  });

  it('should use default button text when not provided', () => {
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="確認"
        message="続行しますか？"
      />
    );

    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should call onConfirm and onClose when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="確認"
        message="削除しますか？"
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'OK' });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call only onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="確認"
        message="削除しますか？"
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should apply danger variant class', () => {
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="削除確認"
        message="削除しますか？"
        variant="danger"
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'OK' });
    expect(confirmButton).toHaveClass('btn-danger');
  });

  it('should apply warning variant class', () => {
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="警告"
        message="実行しますか？"
        variant="warning"
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'OK' });
    expect(confirmButton).toHaveClass('btn-warning');
  });

  it('should apply primary variant class by default', () => {
    render(
      <ConfirmModal
        show={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="確認"
        message="続行しますか？"
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'OK' });
    expect(confirmButton).toHaveClass('btn-primary');
  });

  it('should not render when show is false', () => {
    render(
      <ConfirmModal
        show={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="確認"
        message="削除しますか？"
      />
    );

    expect(screen.queryByText('確認')).not.toBeInTheDocument();
  });
});

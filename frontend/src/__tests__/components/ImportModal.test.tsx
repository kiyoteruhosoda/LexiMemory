// src/__tests__/components/ImportModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportModal } from '../../components/ImportModal';
import * as ioOffline from '../../api/io.offline';

vi.mock('../../api/io.offline', () => ({
  ioApi: {
    import: vi.fn(),
  },
}));

describe('ImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when show is true', () => {
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    expect(screen.getByText('データをインポート')).toBeInTheDocument();
    expect(screen.getByLabelText('JSONファイルを選択')).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    render(<ImportModal show={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    expect(screen.queryByText('データをインポート')).not.toBeInTheDocument();
  });

  it('should default to merge mode', () => {
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const mergeRadio = screen.getByRole('radio', { name: /マージ/i });
    expect(mergeRadio).toBeChecked();
  });

  it('should allow switching to overwrite mode', async () => {
    const user = userEvent.setup();
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const overwriteRadio = document.getElementById('mode-overwrite') as HTMLInputElement;
    await user.click(overwriteRadio);
    
    expect(overwriteRadio).toBeChecked();
  });

  it('should show selected file name', async () => {
    const user = userEvent.setup();
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const file = new File(['{"schemaVersion":1,"words":[]}'], 'test.json', { type: 'application/json' });
    const input = screen.getByLabelText('JSONファイルを選択') as HTMLInputElement;
    
    await user.upload(input, file);
    
    expect(screen.getByText('test.json')).toBeInTheDocument();
  });

  it('should disable import button when no file selected', () => {
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const importButton = screen.getByRole('button', { name: /インポート/i });
    expect(importButton).toBeDisabled();
  });

  it('should enable import button when file is selected', async () => {
    const user = userEvent.setup();
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const file = new File(['{"schemaVersion":1,"words":[]}'], 'test.json', { type: 'application/json' });
    const input = screen.getByLabelText('JSONファイルを選択') as HTMLInputElement;
    
    await user.upload(input, file);
    
    const importButton = screen.getByRole('button', { name: /インポート/i });
    expect(importButton).not.toBeDisabled();
  });

  it('should call import with merge mode', async () => {
    const user = userEvent.setup();
    const importSpy = vi.mocked(ioOffline.ioApi.import).mockResolvedValueOnce({ ok: true });
    
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const mockData = { schemaVersion: 1, words: [{ headword: 'test', pos: 'noun', meaningJa: 'テスト' }], memory: [] };
    const file = new File([JSON.stringify(mockData)], 'test.json', { type: 'application/json' });
    const input = screen.getByLabelText('JSONファイルを選択') as HTMLInputElement;
    
    await user.upload(input, file);
    
    const importButton = screen.getByRole('button', { name: /インポート/i });
    await user.click(importButton);
    
    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledTimes(1);
      expect(importSpy).toHaveBeenCalledWith(mockData, 'merge');
    });
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should call import with overwrite mode', async () => {
    const user = userEvent.setup();
    const importSpy = vi.mocked(ioOffline.ioApi.import).mockResolvedValueOnce({ ok: true });
    
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    // Switch to overwrite mode
    const overwriteRadio = document.getElementById('mode-overwrite') as HTMLInputElement;
    await user.click(overwriteRadio);
    
    const mockData = { schemaVersion: 1, words: [{ headword: 'test', pos: 'noun', meaningJa: 'テスト' }], memory: [] };
    const file = new File([JSON.stringify(mockData)], 'test.json', { type: 'application/json' });
    const input = screen.getByLabelText('JSONファイルを選択') as HTMLInputElement;
    
    await user.upload(input, file);
    
    const importButton = screen.getByRole('button', { name: /インポート/i });
    await user.click(importButton);
    
    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith(mockData, 'overwrite');
    });
  });

  it('should display error message on import failure', async () => {
    const user = userEvent.setup();
    const errorMsg = 'インポートエラー';
    vi.mocked(ioOffline.ioApi.import).mockRejectedValueOnce(new Error(errorMsg));
    
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const mockData = { schemaVersion: 1, words: [], memory: [] };
    const file = new File([JSON.stringify(mockData)], 'test.json', { type: 'application/json' });
    const input = screen.getByLabelText('JSONファイルを選択') as HTMLInputElement;
    
    await user.upload(input, file);
    
    const importButton = screen.getByRole('button', { name: /インポート/i });
    await user.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when close icon is clicked', async () => {
    const user = userEvent.setup();
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable buttons during import', async () => {
    const user = userEvent.setup();
    vi.mocked(ioOffline.ioApi.import).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))); // Resolves slowly
    
    render(<ImportModal show={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const mockData = { schemaVersion: 1, words: [], memory: [] };
    const file = new File([JSON.stringify(mockData)], 'test.json', { type: 'application/json' });
    const input = screen.getByLabelText('JSONファイルを選択') as HTMLInputElement;
    
    await user.upload(input, file);
    
    const importButton = screen.getByRole('button', { name: /インポート$/i });
    await user.click(importButton);
    
    // Check for spinner or disabled state
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const importingButton = buttons.find(btn => btn.textContent?.includes('インポート中'));
      expect(importingButton).toBeDefined();
      expect(importingButton).toBeDisabled();
    });
    
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
    expect(cancelButton).toBeDisabled();
  });
});

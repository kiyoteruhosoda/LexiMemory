import { RnwOutlineButton } from "./RnwOutlineButton";
import { RnwPrimaryButton } from "./RnwPrimaryButton";

type Tone = "danger" | "warning" | "primary";

type RnwConfirmDialogProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
};

const paletteByTone: Record<Tone, { bg: string; border: string; color: string }> = {
  danger: { bg: "#f8d7da", border: "#f1aeb5", color: "#842029" },
  warning: { bg: "#fff3cd", border: "#ffda6a", color: "#664d03" },
  primary: { bg: "#e7f1ff", border: "#9ec5fe", color: "#084298" },
};

export function RnwConfirmDialog({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  tone = "primary",
}: RnwConfirmDialogProps) {
  if (!show) return null;

  const palette = paletteByTone[tone];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1060,
        padding: 12,
      }}
    >
      <section style={{ width: "min(520px, 100%)", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #dee2e6", boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)" }}>
        <header style={{ padding: 12, borderBottom: "1px solid #dee2e6", fontWeight: 700 }}>{title}</header>
        <div style={{ padding: 12 }}>
          <div style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, borderRadius: 6, padding: 10 }}>
            {message}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <RnwOutlineButton label={cancelText} onPress={onClose} />
            <RnwPrimaryButton
              label={confirmText}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

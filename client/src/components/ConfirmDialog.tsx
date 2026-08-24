import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { useI18n } from '../i18n/index.js';

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Yes/no gate for anything destructive — leaving mid-game, ending early, spending coins. */
export function ConfirmDialog({ open, title, body, confirmLabel, danger, onConfirm, onCancel }: Props) {
  const { t } = useI18n();

  return (
    <Modal open={open} onClose={onCancel} label={title} className="confirmdialog">
      <h2 className="confirmdialog__title">{title}</h2>
      <p className="confirmdialog__body">{body}</p>
      <div className="confirmdialog__actions">
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

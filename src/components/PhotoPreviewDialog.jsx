import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function PhotoPreviewDialog({ url, onClose }) {
  return (
    <Dialog open={!!url} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-2">
        {url && <img src={url} alt="Prep completion" className="w-full rounded-lg" />}
      </DialogContent>
    </Dialog>
  );
}
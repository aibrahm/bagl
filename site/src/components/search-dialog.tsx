import { CommandMenu } from "@/components/ui/command-menu";
import { SEARCH_ITEMS } from "@/content/search";

// Loaded the first time someone opens the search box, so pages don't carry the index until then.
export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <CommandMenu open={open} onClose={onClose} items={SEARCH_ITEMS} />;
}

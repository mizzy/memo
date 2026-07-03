import type { FolderSelection, FolderWithCount, VaultWithCount } from "@memo/shared";
import type { FolderNode } from "../folders.js";
import { FolderTree } from "./FolderTree.js";
import { VaultSwitcher } from "./VaultSwitcher.js";

type Props = {
  vaults: VaultWithCount[];
  selectedVault: VaultWithCount | null;
  folders?: FolderWithCount[];
  folderNodes: FolderNode[];
  selectedFolderId: FolderSelection;
  expandedFolderIds: Set<string>;
  rootMemoCount: number;
  onSelectVault: (vault: VaultWithCount) => void;
  onCreateVault: (name: string) => void;
  onDeleteVault: (vault: VaultWithCount) => void;
  onSelectFolder: (folderId: FolderSelection) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
};

export function FolderRail(props: Props) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-hair bg-night-deep/55 px-4 py-6 md:flex">
      <div className="mb-5 px-1 font-display text-xl font-semibold tracking-wide">
        memo<span className="text-lamp">.</span>
      </div>
      <VaultSwitcher
        vaults={props.vaults}
        selectedVault={props.selectedVault}
        onSelect={props.onSelectVault}
        onCreate={props.onCreateVault}
        onDelete={props.onDeleteVault}
      />
      <FolderTree
        nodes={props.folderNodes}
        selectedFolderId={props.selectedFolderId}
        expandedFolderIds={props.expandedFolderIds}
        rootMemoCount={props.rootMemoCount}
        folders={props.folders}
        onSelect={props.onSelectFolder}
        onToggle={props.onToggleFolder}
        onCreateChild={props.onCreateFolder}
        onRename={props.onRenameFolder}
        onDelete={props.onDeleteFolder}
        onMove={props.onMoveFolder}
      />
    </aside>
  );
}

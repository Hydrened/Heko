type AppResponse = 200 | 503;

type Position = {
    x: number;
    y: number;
};

type CssVariableType = "PIXEL" | "MS_DURATION";



type ID = number;
type Token = string;

type UserData = {
    readonly id: ID | null;
    readonly token: Token | null;
    readonly name: string | null;
    readonly email: string | null;
};

type SongSettings = {
    readonly shuffle: boolean;
    readonly loop: boolean;
    readonly speed: number;
    readonly volume: number;
};

type ApparenceSettings = {
    theme: number;
    enableAnimations: boolean;
};

type PreferencesSettings = {
    hideSuccessModals: boolean;
    volumeEasing: number;
};

type Settings = {
    readonly song: SongSettings;
    readonly apparence: ApparenceSettings;
    readonly preferences: PreferencesSettings;
};



type Shortcut = {
    readonly ctrl: boolean;
    readonly shift: boolean;
    readonly alt: boolean;
    readonly key: string;
};

type ShortcutMap = { [name: string]: Shortcut };



type CenterModal = import("./../modals/modal.center.js").default;

type TopModalType = "SUCCESS" | "ERROR";

type ModalRowType = "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD" | "FILE" | "SELECT";
type ModalRowData = string[];

type ModalRow = {
    readonly label: string;
    readonly type: ModalRowType;
    readonly maxLength?: number;
    readonly defaultValue?: string;
    readonly onChange?: (modal: CenterModal) => void;
    readonly data?: ModalRowData;
};

type ModalButton = {
    readonly title: string;
    readonly onClick: () => void;
};

type ModalFieldError = {
    readonly fieldName?: string;
    readonly error: string;
};

type ModalError = ModalFieldError | null;

type CenterModalData = {
    readonly title: string;
    readonly content?: ModalRow[];
    readonly onConfirm: (modal: CenterModal) => Promise<ModalError>;
    readonly onCancel?: () => void;
    readonly additionnalButtons?: ModalButton[];
    readonly cantClose: boolean;
};

type CenterSearchModalData = {
    readonly title: string;
    readonly onCreate?: (container: HTMLElement) => void;
    readonly onConfirm: (modal: CenterModal, container: HTMLElement) => Promise<ModalError>;
    readonly onClose?: () => void;
    readonly onSearch: (container: HTMLElement, query: string) => Promise<void>;
    readonly searchDelay: number;
    readonly cantClose: boolean;
};



type ContextmenuRow = {
    readonly title: string;
    readonly shortcut?: Shortcut;
    readonly onClick?: () => Promise<void>;
    readonly rows?: ContextmenuRow[];
    readonly disabled: boolean;
};



type Song = {
    readonly id: ID;
    readonly fileName: string;
    readonly title: string;
    readonly artist: string;
    readonly duration: number;
    readonly creationDate: string;
};

type MergedPlaylist = {
    readonly id: ID;
    readonly toggled: boolean;
};

type Playlist = {
    readonly id: ID;
    readonly parentID: ID;
    readonly name: string;
    readonly position: number;
    readonly thumbnailFileName: string;
    readonly opened: boolean;
    readonly mergedPlaylist: MergedPlaylist[];
    readonly songs: Song[];
    readonly children: number;
    readonly creationDate: string;
};

type Queue = Song[];



type VideoThumbnail = {
    width: number;
    height: number;
    url: string;
};

type Video = {
    kind: "youtube#searchResult";
    etag: string;
    id: {
        kind: "youtube#video" | "youtube#channel" | "youtube#playlist";
        videoId?: string;
        channelId?: string;
        playlistId?: string;
    };
    snippet: {
        channelId: string;
        channelTitle: string;
        publishedAt: string;
        publishTime?: string;
        title: string;
        description: string;
        thumbnails: {
            default?: VideoThumbnail;
            medium?: VideoThumbnail;
            high?: VideoThumbnail;
        };
        liveBroadcastContent: "none" | "upcoming" | "live";
    };
};



type SongSortType = "id" | "title" | "artist" | "duration";

type MergeSortType = "id" | "name" | "nb-songs" | "duration";

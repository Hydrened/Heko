interface CenterModal {};

type ID = number;
type Token = string;

interface UserData {
    id: ID | null;
    token: Token | null;
};

interface UserSettings {
    userID: ID | null;
    shuffle: boolean;
    loop: boolean;
    speed: number;
    volume: number;
};



interface Shortcut {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    key: string;
};



interface Position {
    x: number;
    y: number;
};



type ModalRowType = "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD" | "FILE" | "SELECT";
type ModalRowData = string[];

interface ModalRow {
    label: string;
    type: ModalRowType;
    maxLength?: number;
    defaultValue?: string;
    data?: ModalRowData;
};

interface ModalRowRes {
    value: string;
    index?: number;
};

type ModalRowsRes = { [fieldName: string]: ModalRowRes };

interface ModalRes {
    modal: CenterModal;
    rows: ModalRowsRes;
};

interface ModalButton {
    title: string;
    onClick: () => void;
};

interface ModalFieldError {
    fieldName?: string;
    error: string;
};

type ModalError = ModalFieldError | null;

interface CenterModalData {
    title: string;
    content?: ModalRow[];
    onConfirm: (res: ModalRes) => Promise<ModalError>;
    onCancel?: () => void;
    additionnalButtons?: ModalButton[];
    cantClose: boolean;
};



type TopModalType = "SUCCESS" | "ERROR";



interface ContextmenuRow {
    title: string;
    shortcut?: Shortcut;
    onClick?: () => Promise<void>;
    rows?: ContextmenuRow[];
    disabled: boolean;
};



interface Playlist {
    id: ID;
    userID: ID,
    parentID: ID;
    name: string;
    position: number;
    thumbnailFileName: string;
    opened: boolean;
    songs: number;
    children: number;
    creationDate: string;
};

interface Song {
    id: ID;
    playlistID: ID;
    fileName: string;
    title: string;
    artist: string;
    duration: number;
    creationDate: string;
};

interface Artist {
    id: ID;
    userID: ID;
    name: string;
};



type Queue = Song[];

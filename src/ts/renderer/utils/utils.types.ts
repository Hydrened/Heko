type Modal = import("./utils.create.js").Modal;

type ID = number;

type CssVariableType = "pixel" | "rem" | "ms-duration" | "hex-color";

type Position = {
    x: number;
    y: number;
};

type Size = {
    w: number;
    h: number;
};

type Rect = Position & Size;

type ColorRGB = {
    r: number;
    g: number;
    b: number;
    a?: number;
};

type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: any) => void;

type Value<T> = {
    readonly id: T;
    readonly name: string;
};

type ValueBase = {
    readonly id: ID;
    readonly name: string;
};

type InputListValue = Value<ID>;

type ElementReference<T extends HTMLElement> = {
    element?: T;
};

type AppArgs = {};



// API-RESULT
type ApiResultSuccess<T = {}> = {
    readonly success: true;
} & T;

type ApiResultError<T = {}> = {
    readonly success: false;
    readonly error: string;
} & T;

type ApiResultClientError = {
    readonly clientError: string;
};

type ApiResultFieldClientError = {
    readonly fieldId: string;
    readonly error: string;
};

type ApiResult<S = {}, E = {}> = ApiResultSuccess<S> | ApiResultError<E>;

// API-RESULT.ARTIST
type CreateArtistApiResult = ApiResult<{ readonly artist: Artist }>;

// API-RESULT.DIALOG
type AskForFileApiResult = ApiResult<{ readonly path: string | null }>;

// API-RESULT.FILE
type ReadFileApiResult = ApiResult<{ readonly data: Uint8Array }>;

// API-RESULT.PLAYLISTS
type CreatePlaylistApiResult = ApiResult;
type EditPlaylistApiResult = ApiResult;
type    GetUserPlaylistsApiResult = ApiResult<{ readonly playlists: Playlist[] }>;
type MergePlaylistInApiResult = ApiResult;
type RemoveUserPlaylistApiResult = ApiResult;
type RemovePlaylistFromMergedUserApiResult = ApiResult;
type SetUserPlaylistOpenedApiResult = ApiResult;
type SetUserPlaylistPositionApiResult = ApiResult;

// API-RESULT.SONGS
type GetUserSongsApiResult = ApiResult<{ readonly songs: Song[] }>;

// API-RESULT.TEMP
type ClearTempApiResult = ApiResult;
type PasteClipbordImageApiResult = ApiResult<{ readonly filePath: string }>;

// API-RESULT.USER
type IsLoggedApiResult = ApiResult;
type LoginApiResult = ApiResult<{}, ApiResultClientError>;
type LogoutApiResult = ApiResult;
type RegisterApiResult = ApiResult<{}, ApiResultClientError>;

// CONTEXTMENU
type ContextmenuShortCut = {
    readonly key: string;
    readonly ctrl?: boolean;
    readonly shift?: boolean;
    readonly alt?: boolean;
};

type ContextmenuRow = {
    readonly title: string;
    readonly shortcut?: ContextmenuShortCut;
    readonly onClick?: () => void;
    readonly rows?: ContextmenuRow[];
    readonly disabled?: boolean;
};

// MODALS
type TabModalTab = {
    readonly title: string;
    readonly id: string;
};

type ModalAdditionalButton = {
    readonly text: string;
    readonly onClick: (modal: Modal) => void;
};

type ModalOptions = {
    readonly className?: string;
    readonly errorMessageOnMandatoryEmptyFields?: boolean;
    readonly additionalButtons?: ModalAdditionalButton[];
    readonly confirmButtonText?: string;
    readonly cancelButtonText?: string;
    readonly animations?: boolean;
    readonly mandatory?: boolean;
};

type TabModalOptions = {
    readonly defaultTabId?: string;
} & ModalOptions;

type ModalFieldChildData<T> = {
    readonly id: string;
    readonly name?: string
    readonly label?: string;
    readonly errorMessage?: (modal: Modal, value: T | null) => string | null;
    readonly isConditionValid?: (modal: Modal, value: T | null) => boolean | Promise<boolean>;
};

type ModalFieldData<T> = {
    readonly id: string;
    readonly name?: string
    readonly label?: string;
    readonly errorMessage?: (modal: Modal, value: T | null) => string | null;
    readonly onChange?: (modal: Modal, value: T | null) => void;
    readonly isConditionValid?: (modal: Modal, value: T | null) => boolean | Promise<boolean>;
};

type ModalFieldMandatoryData = {
    readonly mandatory?: boolean;
};

type ModalFieldPlaceholderData = {
    readonly placeholder?: string;
};

type ModalFieldLengthData = {
    readonly minLength?: number;
    readonly maxLength?: number;
};

type TabModalTabId = {
    readonly tabId: string;
};

type ModalInputFieldData = {
    readonly defaultValue?: string;
    readonly type?: string;
} & ModalFieldData<string> & ModalFieldMandatoryData & ModalFieldPlaceholderData & ModalFieldLengthData;

type TabModalInputFieldData = ModalInputFieldData & TabModalTabId;

type ModalInputListFieldData = {
    readonly data: InputListValue[];
    readonly defaultValue?: ID;
} & ModalFieldData<InputListValue | null> & ModalFieldMandatoryData & ModalFieldPlaceholderData;

type TabModalInputListFieldData = ModalInputListFieldData & TabModalTabId;

type ModalSelectFieldData = {
    readonly data: InputListValue[];
    readonly defaultValue?: ID;
} & ModalFieldData<InputListValue>;

type TabModalSelectFieldData = ModalSelectFieldData & TabModalTabId;

type ModalUnfilteredSmartListFieldData = {
    readonly defaultValues?: string[];
} & ModalFieldData<string[]> & ModalFieldMandatoryData & ModalFieldPlaceholderData;

type TabModalUnfilteredSmartListFieldData = ModalUnfilteredSmartListFieldData & TabModalTabId;

type ModalFilteredSmartListFieldData = {
    readonly data: InputListValue[];
    readonly defaultValues?: ID[];
    readonly onInvalidAdd?: (query: string) => (InputListValue | null) | Promise<InputListValue | null>;
} & ModalFieldData<InputListValue[]> & ModalFieldMandatoryData & ModalFieldPlaceholderData;

type TabModalFilteredSmartListFieldData = ModalFilteredSmartListFieldData & TabModalTabId;

type ModalRadioFieldData = {
    readonly data: InputListValue[];
    readonly defaultValue?: ID;
} & ModalFieldData<InputListValue | null> & ModalFieldMandatoryData;

type TabModalRadioFieldData = ModalRadioFieldData & TabModalTabId;

type ModalMultiRadioFieldData = {
    readonly data: InputListValue[];
    readonly defaultValues?: ID[];
} & ModalFieldData<InputListValue[]> & ModalFieldMandatoryData;

type TabModalMultiRadioFieldData = ModalMultiRadioFieldData & TabModalTabId;

type ModalTextareaFieldData = {
    readonly defaultValue?: string;
} & ModalFieldData<string> & ModalFieldMandatoryData & ModalFieldPlaceholderData & ModalFieldLengthData;

type TabModalTextareaFieldData = ModalTextareaFieldData & TabModalTabId;

type ModalCheckboxFieldData = {
    readonly defaultValue?: boolean;
} & ModalFieldData<boolean>;

type TabModalCheckboxFieldData = ModalCheckboxFieldData & TabModalTabId;

type ModalDateFieldData = {
    readonly defaultValue?: string;
} & ModalFieldData<string> & ModalFieldMandatoryData;

type TabModalDateFieldData = ModalDateFieldData & TabModalTabId;

type ModalPictureFieldData = {
    readonly defaultValue?: string;
    readonly aspectRatio: string;
} & ModalFieldData<string> & ModalFieldMandatoryData;

type TabModalPictureFieldData = ModalPictureFieldData & TabModalTabId;

type ModalFileFieldData = {
    readonly defaultValue?: string;
    readonly fileZoneText: string;
    readonly dialogTitle: string;
    readonly fileTypeName?: string;
    readonly extensions?: string[];
} & ModalFieldData<string> & ModalFieldMandatoryData;

type TabModalFileFieldData = ModalFileFieldData & TabModalTabId;

type SmallModalOption<T> = {
    readonly shortcut?: string;
    readonly onClick?: () => void | Promise<void>;
} & Value<T>;



// HEKO
type PlaylistElements = {
    readonly wrapperElement: HTMLLIElement;
    readonly containerElement: HTMLElement;
    readonly childrenContainerElement: HTMLUListElement;
    readonly nameElement: HTMLParagraphElement;
    readonly childCountElement: HTMLParagraphElement;
    readonly moveInZoneElement?: HTMLElement;
};

type PlaylistWithElements = Playlist & {
    elements?: PlaylistElements;
};

type PlaylistWithRect = PlaylistWithElements & {
    readonly containerRect: Rect;
    readonly moveInZoneRect?: Rect;
};

type PlaylistHierarchy<T extends Playlist> = {
    readonly playlist: T;
    readonly children: PlaylistHierarchy<T>[];
};

type Artist = {
    readonly id: ID;
    readonly name: string;
};

type Song = {
    readonly id: ID;
    readonly title: string;
    readonly artists: Artist[];
    readonly duration: number;
    readonly creationDate: string;
    readonly fileName: string;
};

type Merged = {
    readonly id: ID;
    readonly name: string;
    readonly position: number;
    readonly thumbnailFileName: string;
    readonly creationDate: string;
    readonly toggled: boolean;
};

type PlaylistType = "merged-playlist" | "song-playlist";

type PlaylistSortType = "id" | "playlist-name" | "playlist-song-count" | "song-title" | "song-artist" | "duration";

type Playlist = {
    readonly id: ID;
    readonly parentId: ID;
    readonly name: string;
    readonly position: number;
    readonly thumbnailFileName: string;
    opened: boolean;
    readonly creationDate: string;
    readonly songIds: ID[];
    readonly mergedIds: ID[];
    readonly childIds: ID[];
};

type ManagePlaylistModalDefaultValues = {
    readonly name?: string;
    readonly thumbnailFileName?: string;
};

type ThumbnailEditType = "update" | "keep" | "remove";

type ManagePlaylistModalReturntValues = {
    readonly name: string;
    readonly thumbnail: File | null;
    readonly thumbnailEditType: ThumbnailEditType;
};

type TempFocusedPlaylist = {
    readonly playlist: PlaylistWithElements;
    readonly mousePositionStart: Position;
};

type FocusedPlaylist = {
    readonly id: ID;
    readonly defaultElement: HTMLElement;
    readonly movingElement: HTMLElement;
    readonly rect: Rect;
    readonly offset: Position;
    playlistRects: PlaylistWithRect[];
};

type PlaylistHoverHandler = {
    readonly id: ID;
    readonly element: HTMLElement;
    readonly rect: Rect;
    readonly startTime: number;
    readonly startTimeout: ReturnType<typeof setTimeout>;
};

type MovePlaylistPositionData = {
    readonly id: ID;
    readonly parentId: ID;
    readonly position: number;
};

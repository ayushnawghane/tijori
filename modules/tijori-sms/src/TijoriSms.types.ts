export type NativeSms = {
  /** Sender ID as the phone shows it, e.g. "AD-HDFCBK-S". */
  sender: string;
  body: string;
  /** Milliseconds since epoch when the message was received. */
  timestamp: number;
};

export type TijoriSmsModuleEvents = {
  onSmsReceived: (message: NativeSms) => void;
};

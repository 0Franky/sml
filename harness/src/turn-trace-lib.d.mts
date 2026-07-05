export function contentText(content: unknown): string;
export function isSystemRole(role: unknown): boolean;
export function extractSystemText(payload: any): string;
export function isToolResult(m: any): boolean;
export interface MessagesInfo {
  count: number;
  roles: string[];
  userTurns: number;
  toolResults: number;
  text: string;
}
export function messagesInfo(payload: any): MessagesInfo;
export function messagesDump(payload: any): { role: string; text: string; toolResult: boolean }[];
export function laneOverlap(systemText: string, nativeText: string): { laneLines: number; overlap: number };

export interface DumpMessage { role: string; text: string; toolResult?: boolean }
export interface RawDump { ts: any; convId: any; system: string; messages: { role: string; toolResult: boolean; text: string }[] }
export function buildRawDump(input: { ts?: any; convId?: any; system?: string; messages?: DumpMessage[] }): RawDump;
export function buildFullMd(input: { ts?: any; convId?: any; system?: string; messages?: DumpMessage[]; tokens?: any }): string;
export const VERBATIM_SYS_MARK: string;
export const VERBATIM_NATIVE_MARK: string;
export const VERBATIM_END_MARK: string;

declare const _default: {
  contentText: typeof contentText;
  isSystemRole: typeof isSystemRole;
  extractSystemText: typeof extractSystemText;
  isToolResult: typeof isToolResult;
  messagesInfo: typeof messagesInfo;
  messagesDump: typeof messagesDump;
  laneOverlap: typeof laneOverlap;
  buildRawDump: typeof buildRawDump;
  buildFullMd: typeof buildFullMd;
};
export default _default;

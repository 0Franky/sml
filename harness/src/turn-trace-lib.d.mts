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
export function laneOverlap(systemText: string, nativeText: string): { laneLines: number; overlap: number };

declare const _default: {
  contentText: typeof contentText;
  isSystemRole: typeof isSystemRole;
  extractSystemText: typeof extractSystemText;
  isToolResult: typeof isToolResult;
  messagesInfo: typeof messagesInfo;
  laneOverlap: typeof laneOverlap;
};
export default _default;

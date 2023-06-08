/**
 * "LuaManager.createLuaEnvironment()"を実行する前にLua関数を呼び出した時に発生させるエラー
 */
export class LuaNotInitializedError extends Error {
    message: string = "A Lua function was called before initialization. Make sure that \"LuaManager.createLuaEnvironment()\" is being called first.";
}
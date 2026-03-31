/**
 * 在普通网页上挂载拖尾：需同时开启「启用」与「应用到全部页面」。
 * 逻辑在 mouseTrailContentBundle.ts（单文件打包，禁止再引用 ../utils）。
 */
import { bootMouseTrailContentScript } from './mouseTrailContentBundle';

bootMouseTrailContentScript();

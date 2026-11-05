import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const dataUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = async path => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const reactUrl = import.meta.resolve('react');
const accessUrl = dataUrl(await compile('../src/config/access.ts'));
const permissionsUrl = dataUrl(await compile('../src/config/permissions.ts'));
const { ALL_PERMISSIONS: P } = await import(permissionsUrl);
const uiUrl = dataUrl(`import React from ${JSON.stringify(reactUrl)};
  const Container = ({children}) => React.createElement('div',null,children);
  export const Layout = Object.assign(Container,{Content:Container,Sider:Container});
  export const Menu = ({items}) => {globalThis.priceMenuItems=items;return null;};
  export const Dropdown=Container,Space=Container,Avatar=Container,Button=Container;
  export const message={success(){}};`);
const icons = ['MenuFoldOutlined','MenuUnfoldOutlined','UserOutlined','GlobalOutlined','ScheduleOutlined',
  'StarOutlined','UnorderedListOutlined','CalendarOutlined','EnvironmentOutlined','UsergroupAddOutlined',
  'SafetyOutlined','GiftOutlined','FieldTimeOutlined','MoneyCollectOutlined'];
const iconsUrl = dataUrl(icons.map(name => `export const ${name}=()=>null;`).join('\n'));
const routerUrl = dataUrl(`import React from ${JSON.stringify(reactUrl)};
  export const Link=({to,children})=>React.createElement('a',{href:to},children);
  export const Outlet=()=>null,useLocation=()=>({pathname:'/admin/managerTour/price'}),useNavigate=()=>()=>{};`);
const hooksUrl = dataUrl('export const useAppSelector=selector=>selector({auth:{user:globalThis.priceMenuUser,isAuth:true}}),useAppDispatch=()=>()=>{};');
let source = await compile('../src/pages/Admin/LayoutAdmin.tsx');
const modules = {
  '@/config/access': accessUrl, '@/config/permissions': permissionsUrl,
  react: reactUrl, 'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  '@ant-design/icons': iconsUrl, antd: uiUrl, 'react-router-dom': routerUrl, '@/store/hooks': hooksUrl,
  'react-toastify': dataUrl('export const ToastContainer=()=>null,Bounce={};'),
  '@/store/slices/authSlice': dataUrl('export const logoutUser=()=>({type:"logout"});'),
  '@/assets/branding/sgu-tour-header.svg': dataUrl('export default "fixture-logo.svg";'),
  '@/assets/branding/sgu-tour-icon.svg': dataUrl('export default "fixture-icon.svg";'),
};
for (const [specifier, replacement] of Object.entries(modules)) {
  source = source.replaceAll(`'${specifier}'`, JSON.stringify(replacement)).replaceAll(`"${specifier}"`, JSON.stringify(replacement));
}
const { default: Sidebar } = await import(dataUrl(source));
const staff = permissions => ({ id: 2, username: 'Staff', status: 'ACTIVE', role: { name: 'staff', active: true, permissions } });
function menuKeys(user) {
  globalThis.priceMenuUser = user; globalThis.priceMenuItems = [];
  renderToStaticMarkup(React.createElement(Sidebar));
  const collect = items => items.flatMap(item => [item.key, ...collect(item.children ?? [])]);
  return collect(globalThis.priceMenuItems);
}

test('price-only staff see the price menu without requiring tour permissions', () => {
  const keys = menuKeys(staff([P.PRICE.GET_LIST]));
  assert.ok(keys.includes('/admin/managerTour/price'));
  assert.ok(!keys.includes('/admin/managerTour/list'));
});
test('tour-only staff do not receive a price menu whose route they cannot open', () => {
  const keys = menuKeys(staff([P.TOURS.GET_LIST]));
  assert.ok(keys.includes('/admin/managerTour/list'));
  assert.ok(!keys.includes('/admin/managerTour/price'));
});
test('active admins retain both tour and price navigation', () => {
  const user = staff([]); user.role.name = 'admin';
  const keys = menuKeys(user);
  assert.ok(keys.includes('/admin/managerTour/list'));
  assert.ok(keys.includes('/admin/managerTour/price'));
});
test('locked, archived or inactive-role accounts do not receive price navigation', () => {
  for (const status of ['LOCKED', 'ARCHIVED']) {
    const user = staff([P.PRICE.GET_LIST]); user.status = status;
    assert.ok(!menuKeys(user).includes('/admin/managerTour/price'));
  }
  const user = staff([P.PRICE.GET_LIST]); user.role.active = false;
  assert.ok(!menuKeys(user).includes('/admin/managerTour/price'));
});

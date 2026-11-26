import { ProTable, type ProTableProps } from '@ant-design/pro-components';
import { Table, type TableProps } from 'antd';
import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import AdminPagination from './AdminPagination';
import { useAdminPagination } from './useAdminPagination';

const classes = (value?: string) => ['admin-data-table', value].filter(Boolean).join(' ');
type Options = { pageScope?: string; filterKey?: string };

function useFilterReset(filterKey: string | undefined, paging: ReturnType<typeof useAdminPagination>) {
  const previous = useRef(filterKey);
  useEffect(() => {
    if (previous.current === filterKey) return;
    previous.current = filterKey;
    if (paging.page !== 1) paging.change(1);
  }, [filterKey, paging]);
}
export function AdminProTable<T extends object, U extends Record<string, unknown> = Record<string, unknown>>(
  { pageScope, filterKey, ...props }: ProTableProps<T, U> & Options,
) {
  const paging = useAdminPagination(pageScope);
  useFilterReset(filterKey, paging);
  const [count, setCount] = useState(0);
  const priorFilter = useRef('');
  const { pathname } = useLocation();
  const rows = props.dataSource || [];
  const total = props.request ? count : rows.length;
  const current = Math.min(paging.page, Math.max(1, Math.ceil(total / paging.size)));
  const start = (current - 1) * paging.size;
  const paginate = props.pagination !== false;
  const request = props.request;
  return <div ref={paging.tableRef} className="admin-table-frame">
    <ProTable<T, U> {...props} className={classes(props.className)} scroll={undefined} pagination={false}
      dataSource={props.dataSource && paginate ? rows.slice(start, start + paging.size) : props.dataSource}
      params={request && paginate ? { ...props.params, adminPage: paging.page, adminSize: paging.size } as unknown as U : props.params}
      request={request && paginate ? async (params, sort, filter) => {
        const fields = { ...params };
        delete fields.adminPage;
        delete fields.adminSize;
        const signature = JSON.stringify([pathname, fields, sort, filter]);
        const changed = !!priorFilter.current && signature !== priorFilter.current;
        priorFilter.current = signature;
        const response = await request(fields, sort, filter);
        const data = response.data || [];
        setCount(data.length);
        const page = changed ? 1 : Math.min(paging.page, Math.max(1, Math.ceil(data.length / paging.size)));
        if (changed && paging.page !== 1) paging.change(1);
        const offset = (page - 1) * paging.size;
        return { ...response, data: data.slice(offset, offset + paging.size) };
      } : request} />
    {paginate && <AdminPagination {...paging} total={total} onChange={paging.change} />}
  </div>;
}

export function AdminTable<T extends object>({ pageScope, filterKey, ...props }: TableProps<T> & Options) {
  const paging = useAdminPagination(pageScope);
  useFilterReset(filterKey, paging);
  const rows = props.dataSource || [];
  const config = props.pagination || undefined;
  const remote = config?.current !== undefined && config.total !== undefined && !!config.onChange;
  const total = remote ? config.total! : rows.length;
  const size = remote ? config.pageSize || paging.size : paging.size;
  const page = remote ? config.current! : Math.min(paging.page, Math.max(1, Math.ceil(total / size)));
  const offset = (page - 1) * size;
  return <div ref={paging.tableRef} className="admin-table-frame">
    <Table<T> {...props} className={classes(props.className)} scroll={undefined} pagination={false}
      dataSource={props.pagination === false || remote ? props.dataSource : rows.slice(offset, offset + size)} />
    {props.pagination !== false && <AdminPagination page={page} size={size} mode={remote ? size : paging.mode} total={total} onChange={remote ? (next, nextSize = size) => config.onChange!(next, nextSize === 'auto' ? 10 : nextSize) : paging.change} />}
  </div>;
}

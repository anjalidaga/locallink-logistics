import { Status } from '../types';
export default function Badge({ status }: { status: Status }) {
  const c = status === 'Delivered' ? 'ok' : status === 'Delayed' ? 'warn' : 'info';
  return <span className={'badge ' + c}>{status}</span>;
}

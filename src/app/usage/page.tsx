import { redirect } from 'next/navigation';

export default function UsagePage(): never {
  redirect('/settings/usage');
}

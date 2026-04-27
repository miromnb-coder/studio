import { redirect } from 'next/navigation';

export default function SupportPage(): never {
  redirect('/settings');
}

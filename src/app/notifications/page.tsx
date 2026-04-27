import { redirect } from 'next/navigation';

export default function NotificationsPage(): never {
  redirect('/settings/notifications');
}

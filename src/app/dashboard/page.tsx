"use client";

import { MinimalDashboard } from "@/components/dashboard/MinimalDashboard";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, limit, orderBy, query } from "firebase/firestore";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, "users", user.uid, "analyses"), orderBy("createdAt", "desc"), limit(20));
  }, [db, user, isUserLoading]);

  const { data: analyses } = useCollection(analysesQuery);

  return <MinimalDashboard analyses={analyses ?? []} />;
}

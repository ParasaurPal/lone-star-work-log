import { useCallback, useEffect, useState } from "react";
import { localStore } from "@/api/localStore";

function toArray(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return result.items ?? [];
}

export function useApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await localStore.entities.JobApplication.filter(
        {},
        { sort: "-date_applied", limit: 500 },
      );
      setItems(toArray(page));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

export function useInterviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await localStore.entities.Interview.filter(
        {},
        { sort: "interview_date_time", limit: 300 },
      );
      setItems(toArray(page));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

const DEFAULT_SETTINGS = {
  notification_channel: "Push",
  reminder_day: "Friday",
  reminder_time: "09:00",
  enabled: true,
  weekly_search_goal: 5,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = toArray(await localStore.entities.NotificationSettings.list());
      if (list.length > 0) {
        setSettings(list[0]);
      } else {
        setSettings(await localStore.entities.NotificationSettings.create(DEFAULT_SETTINGS));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { settings, loading, reload, setSettings, DEFAULT_SETTINGS };
}

export function useFiledWeeks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await localStore.entities.FiledWeek.filter(
        {},
        { sort: "-week_ending", limit: 100 },
      );
      setItems(toArray(page));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

export function useNotificationLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await localStore.entities.NotificationLog.filter(
        {},
        { sort: "-sent_at", limit: 25 },
      );
      setItems(toArray(page));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}
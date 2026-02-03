import { useState, useEffect, useCallback } from "react";
import { api } from "../api/axios";

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { immediate = true, params = {} } = options;

  const fetchData = useCallback(
    async (fetchParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(url, {
          params: { ...params, ...fetchParams },
        });
        setData(response.data);
        return response.data;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, JSON.stringify(params)],
  );

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate]);

  return { data, loading, error, refetch: fetchData };
};

export const useMutation = (method = "post") => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (url, data = {}, config = {}) => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (method === "post") {
          response = await api.post(url, data, config);
        } else if (method === "put") {
          response = await api.put(url, data, config);
        } else if (method === "delete") {
          response = await api.delete(url, config);
        }

        return { success: true, data: response.data };
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [method],
  );

  return { mutate, loading, error };
};

export const usePagination = (url, pageSize = 20) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(
    async (pageNum = 1, refresh = false) => {
      if (loading) return;

      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await api.get(url, {
          params: { page: pageNum, limit: pageSize },
        });

        const newData = response.data.data || [];
        const totalPages = response.data.pages || 1;

        if (refresh || pageNum === 1) {
          setData(newData);
        } else {
          setData((prev) => [...prev, ...newData]);
        }

        setPage(pageNum);
        setHasMore(pageNum < totalPages);

        return response.data;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [url, pageSize, loading],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchData(page + 1);
    }
  }, [hasMore, loading, page, fetchData]);

  const refresh = useCallback(() => {
    fetchData(1, true);
  }, [fetchData]);

  useEffect(() => {
    fetchData(1);
  }, []);

  return {
    data,
    loading,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    refetch: fetchData,
  };
};

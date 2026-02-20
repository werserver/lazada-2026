import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchProducts } from "@/lib/api";
import { fetchCsvProducts } from "@/lib/csv-products";
import { fetchSitemapProducts } from "@/lib/sitemap-parser";
import { getAdminSettings } from "@/lib/store";

export function useProducts(keyword?: string, categoryId?: string, page = 1) {
  const queryClient = useQueryClient();
  const settings = getAdminSettings();
  const dataSource = settings.dataSource;
  const advertiserIds = settings.selectedAdvertisers.length > 0
    ? settings.selectedAdvertisers.join(",")
    : undefined;

  const query = useQuery({
    queryKey: ["products", dataSource, keyword, categoryId, page, advertiserIds],
    queryFn: () => {
      if (dataSource === "csv") {
        return fetchCsvProducts({
          keyword: keyword || undefined,
          limit: 20,
          page,
        });
      }
      if (dataSource === "sitemap") {
        return fetchSitemapProducts({
          keyword: keyword || undefined,
          limit: 20,
          page,
        });
      }
      return fetchProducts({
        keyword: keyword || undefined,
        category_id: categoryId || undefined,
        advertiser_id: advertiserIds,
        limit: 20,
        page,
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  // Prefetch next page
  useEffect(() => {
    if (query.data && page * 20 < query.data.meta.total) {
      queryClient.prefetchQuery({
        queryKey: ["products", dataSource, keyword, categoryId, page + 1, advertiserIds],
        queryFn: () => {
          if (dataSource === "csv") {
            return fetchCsvProducts({
              keyword: keyword || undefined,
              limit: 20,
              page: page + 1,
            });
          }
          if (dataSource === "sitemap") {
            return fetchSitemapProducts({
              keyword: keyword || undefined,
              limit: 20,
              page: page + 1,
            });
          }
          return fetchProducts({
            keyword: keyword || undefined,
            category_id: categoryId || undefined,
            advertiser_id: advertiserIds,
            limit: 20,
            page: page + 1,
          });
        },
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [query.data, page, keyword, categoryId, advertiserIds, dataSource, queryClient]);

  return query;
}

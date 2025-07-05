import { api } from "./api";

export interface DashboardData {
  total_user: number;
  total_content: number;
  total_revenue: number;
  with_ads: number;
  without_ads: number;
  genre_distribution: {
    genre_id: number;
    name: string;
    percentage: number;
  }[];
}

export interface Genre {
  id: number;
  name: string;
  thumbnail: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: number;
  title: string;
  director_name: string;
  profile_pic: string;
  description: string;
  publish: string;
  schedule: string;
  genre_id: number;
  image: string;
  created_at: string;
  total_view: number;
  total_likes: number;
  genre_name: string;
  video1?: string | object; // Add video1 field
  genres?: {
    id: number;
    name: string;
    thumbnail: string;
    created_at: string;
    updated_at: string;
  };
}

export const dashboardService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get("/api/dashboard");
    return response.data.data;
  },
};

export const genreService = {
  getGenres: async (
    page = 1
  ): Promise<{
    data: Genre[];
    total: number;
    per_page: number;
    current_page: number;
  }> => {
    const response = await api.get(`/api/genres?page=${page}`);
    return response.data;
  },

  createGenre: async (data: FormData): Promise<Genre> => {
    const response = await api.post("/api/genres", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateGenre: async (id: number, data: FormData): Promise<Genre> => {
    const response = await api.post(`/api/genres/${id}?_method=PUT`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteGenre: async (id: number): Promise<void> => {
    await api.delete(`/api/genres/${id}`);
  },
};

export const contentService = {
  getContents: async (
    page = 1
  ): Promise<{
    data: Content[];
    total: number;
    per_page: number;
    current_page: number;
  }> => {
    const response = await api.get(`/api/contents?page=${page}`);
    return response.data;
  },

  getContent: async (id: number): Promise<Content> => {
    const response = await api.get(`/api/content/${id}`);
    return response.data.data;
  },

  createContent: async (
    data: FormData,
    onUploadProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<Content> => {
    console.log("🚀 Creating content with FormData");

    // Log FormData contents for debugging
    console.log("📤 FormData contents being sent:");
    for (const [key, value] of data.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    const response = await api.post("/api/contents", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });

    console.log("✅ Content created successfully:", response.data);
    return response.data;
  },

  updateContent: async (id: number, data: FormData): Promise<Content> => {
    console.log(`🔄 Updating content ${id} with FormData`);

    // Log FormData contents for debugging
    console.log("📤 FormData contents being sent:");
    for (const [key, value] of data.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    const response = await api.post(`/api/contents/${id}?_method=PUT`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("✅ Content updated successfully:", response.data);
    return response.data;
  },

  deleteContent: async (id: number): Promise<void> => {
    await api.delete(`/api/contents/${id}`);
  },
};

export interface Subscription {
  id: number;
  plan_name: string;
  price: number;
  description: string;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string;
  country: string | null;
  city: string | null;
}

export const subscriptionService = {
  getSubscriptions: async (): Promise<{
    data: Subscription[];
    withads_count: number;
    withoutads_count: number;
  }> => {
    const response = await api.get("/api/subscriptions");
    return response.data;
  },

  createSubscription: async (data: {
    plan_name: string;
    price: number;
    description: string;
    features: string[];
  }): Promise<Subscription> => {
    const response = await api.post("/api/subscriptions", data);
    return response.data;
  },

  updateSubscription: async (
    id: number,
    data: {
      plan_name: string;
      price: number;
      description: string;
      features: string[];
    }
  ): Promise<Subscription> => {
    const response = await api.post(
      `/api/subscriptions/${id}?_method=PUT`,
      data
    );
    return response.data;
  },

  deleteSubscription: async (id: number): Promise<void> => {
    await api.delete(`/api/subscriptions/${id}`);
  },
};

export const settingsService = {
  getUserInfo: async (): Promise<UserInfo> => {
    const response = await api.get("/api/settings/info");
    return response.data.data;
  },

  updateUserInfo: async (data: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    country: string;
    city: string;
  }): Promise<UserInfo> => {
    const response = await api.post("/api/settings/info", data);
    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<void> => {
    await api.post("/api/settings/password?_method=PUT", data, {
      headers: { "Content-Type": "application/json" },
    });
  },
};

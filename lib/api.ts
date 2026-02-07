export interface Project {
  id: number;
  slug: string;
  title: string;
  titleIT: string;
  category: string;
  categoryIT: string;
  image_src: string;
  description: string;
  descriptionIT: string;
  technologies: string[];
  features: string[];
  featuresIT: string[];
  year: string;
  client: string;
  clientIT: string;
  website_url: string;
}

interface ApiResponse {
  success: boolean;
  data: Project[];
}

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch("https://v0-adminca-bk.vercel.app/api/projects", {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      console.error("Failed to fetch projects:", res.status, res.statusText);
      return [];
    }
    
    const json: ApiResponse = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

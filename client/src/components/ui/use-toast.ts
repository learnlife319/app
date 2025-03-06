import { toast } from "react-hot-toast";

export function useToast() {
  return {
    toast: {
      title: (title: string) => toast(title),
      description: (desc: string) => toast(desc),
      error: (error: string) => toast.error(error),
      success: (msg: string) => toast.success(msg),
    }
  };
}

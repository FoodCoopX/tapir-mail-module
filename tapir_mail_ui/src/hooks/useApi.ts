import { Configuration } from "../api_client";
import env from "../env";

export function useApi<T>(
  ApiClient: new (configuration: Configuration) => T,
): T {
  return new ApiClient(
    new Configuration({
      basePath: env.REACT_APP_API_ROOT as string,
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
      },
    }),
  );
}

const getCookie = (name: string) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue as string;
};

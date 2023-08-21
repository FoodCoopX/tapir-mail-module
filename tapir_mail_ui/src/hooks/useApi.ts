import { Configuration } from '../api_client';

export function useApi<T>(ApiClient: new (configuration: Configuration) => T): T {
    return new ApiClient(new Configuration({
        basePath: process.env.REACT_APP_API_ROOT as string
    }));
}
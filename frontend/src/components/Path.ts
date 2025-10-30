const app_name = 'seesagenda.online'

export function buildPath(route: string): string
{
    if (process.env.NODE_ENV !== 'development')
    {
        return 'http://' + app_name + ':5000/' + route;
    }
    else
    {
        // In development, use relative path - Vite proxy will handle it
        return '/' + route;
    }
}

export default buildPath;
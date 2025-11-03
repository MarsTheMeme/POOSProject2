const app_name = 'seesagenda.online'
//const app_name = '104.236.104.204' Kit's test server
export function buildPath(route: string): string
{
    if (process.env.NODE_ENV !== 'development')
    {
        return 'http://' + app_name + ':5000/' + route;
    }
    else
    {
        return 'http://localhost:5000/' + route;
    }
}

export default buildPath;
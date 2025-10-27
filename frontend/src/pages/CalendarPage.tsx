import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import CalendarUI from '../components/CalendarUI';

const CalendarPage = () =>
{
    return(
        <div>
            <PageTitle />
            <LoggedInName />
            <CalendarUI />
        </div>
    );
}

export default CalendarPage;
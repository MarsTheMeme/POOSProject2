import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import CalendarUI from '../components/CalendarUI';
import FriendUI from '../components/FriendUI';

const CalendarPage = () =>
{
    return(
        <div>
            <PageTitle />
            <LoggedInName />
            <CalendarUI />
            <FriendUI />
        </div>
    );
}

export default CalendarPage;
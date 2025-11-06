import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import CalendarUI from '../components/CalendarUI';
import FriendUI from '../components/FriendUI';
import './CalendarPage.css';

const CalendarPage = () =>
{
    return(
        <div className="calendar-page">
            <div className="calendar-card">
                <PageTitle />
                <div className="calendar-header">
                    <LoggedInName />
                </div>
                <div className="calendar-sections">
                    <CalendarUI friendCard={<FriendUI className="friend-card" />} />
                </div>
            </div>
        </div>
    );
}

export default CalendarPage;

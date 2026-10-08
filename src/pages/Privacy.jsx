import { Link } from 'react-router-dom';
import './Privacy.css';

export default function Privacy() {
  return (
    <div className="page privacy">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-desc">
            What the Sustainable Travel Hub does with your data in plain English. No account, no adverts, no tracking cookies.
          </p>
        </div>
      </section>

      <section className="section privacy-content">
        <div className="container privacy-body">
          <h2>Your location</h2>
          <p>
            If you allow it, your browser shares your location so the app can start journeys from where you are, show
            the arrow on the map and guide you turn by turn. You can say no and type a starting point instead. When you
            plan a journey, the start and destination coordinates are sent to our server and on to Google to work out
            the routes. Our server keeps a route in memory for about two minutes (so repeat searches are fast) and does
            not store your location.
          </p>

          <h2>Your phone's compass</h2>
          <p>
            On phones, the compass is used only on your device to point the map arrow the way you're facing. Nothing
            about it is sent anywhere.
          </p>

          <h2>Place searches</h2>
          <p>
            What you type in the search boxes is sent through our server to Google to suggest places. We don't keep a
            record of your searches.
          </p>

          <h2>Stored on your device only</h2>
          <ul>
            <li>Saved Home and Work places and starred trips</li>
            <li>Your CO₂ tracker, streak and journey history</li>
            <li>Leave-by reminders, and your light/dark theme choice</li>
          </ul>
          <p>
            These stay in your browser's storage and never reach our server. Clearing this site's data in your browser
            settings deletes them.
          </p>

          <h2>Anonymous campus totals</h2>
          <p>
            When you finish a green journey, the app sends only the travel mode and distance, so we can show the Team UoS
            total. It contains no name, account, device ID or location.
          </p>

          <h2>Contact form</h2>
          <p>
            If you send us a message, we store your name, email address, topic and message so the admin team can read it
            and reply. Only signed-in admins can see messages. They're deleted automatically after 12 months (messages
            marked as spam after 30 days), or sooner if you ask us to delete them.
          </p>

          <h2>Server logs</h2>
          <p>
            Like any website, our hosting providers record technical logs, including IP addresses, to keep the service
            secure and to stop abuse (for example, limiting how many requests one address can make). These are kept only
            as long as needed for that purpose.
          </p>

          <h2>Services we use</h2>
          <ul>
            <li>
              <strong>Google Maps Platform</strong> — the home-page map, place search and journey planning. Use of these
              features is subject to the{' '}
              <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Google Maps Terms of Service</a>{' '}
              and the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
            </li>
            <li>
              <strong>OpenStreetMap</strong> — map tiles on the Live Map page are loaded from OpenStreetMap's servers.
            </li>
            <li>
              <strong>Bus Open Data Service</strong> (Department for Transport) — live bus positions and fares. Our server
              fetches these; your browser doesn't contact it.
            </li>
            <li>
              <strong>Vercel, Render and Neon</strong> — host the website, the server and its database.
            </li>
          </ul>

          <h2>Questions</h2>
          <p>
            {/* Contact the team that runs this app, or the University of Sunderland's Data Protection Officer, if you have
            any questions about your data. */}
            Contact the University of Sunderland Developer Society if you have any questions about your data, or to ask
            us to delete a message you sent — use the <Link to="/contact?topic=privacy">contact form</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}

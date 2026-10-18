import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PrivacyChoices from '../components/PrivacyChoices';
import './Privacy.css';

// Update when the notice changes
const LAST_UPDATED = '18 October 2026';

export default function Privacy() {
  const { hash } = useLocation();
  // "Privacy choices" links (footer, map placeholders) jump straight to the choices
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="page privacy">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Privacy Notice</h1>
          <p className="page-desc">
            What the Sustainable Travel Hub does with your data in plain English. No account, no adverts, no tracking
            cookies. Last updated {LAST_UPDATED}.
          </p>
        </div>
      </section>

      <section className="section privacy-content">
        <div className="container privacy-body">
          <h2>Who we are</h2>
          <p>
            The Sustainable Travel Hub is run by the University of Sunderland Developer Society, which is responsible for
            your data in this app (the "controller"). It is an independent project, not an official University of
            Sunderland service, and the University is not responsible for how this app handles your data. You can contact
            us about your data using the <Link to="/contact?topic=privacy">contact form</Link>.
          </p>

          <h2 id="choices" tabIndex={-1}>Your choices</h2>
          <p>
            Maps from Google and OpenStreetMap, and anonymous visit counting, only start once you allow them. You can
            change your mind at any time here.
          </p>
          <PrivacyChoices />

          <h2>Your location</h2>
          <p>
            If you allow it, your browser shares your location so the app can start journeys from where you are, show
            where you are on the maps (including the Live Map) and guide you turn by turn. Once you've allowed it on one
            page, other pages use it too, without asking again. You can say no and type a starting point instead, and
            you can switch location off in your browser's settings at any time.
          </p>
          <p>
            When you plan a journey, the start and destination coordinates are sent to our server and on to Google to
            work out the routes. Our server keeps a route in memory for about two minutes (so repeat searches are fast)
            and does not store your location. To find live train platforms, the station's location is sent to our server,
            not yours. To show live buses and trains, the app sends our server the area of the map you're looking at; it
            isn't stored.
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

          <h2>Maps</h2>
          <p>
            If you allow maps, your browser loads them directly from Google Maps (the journey planner and trips) and
            OpenStreetMap (the Live Map). Like any website, they receive your IP address and basic details about your
            browser when the map loads, and Google receives the area of the map you're looking at. Until you allow maps,
            nothing is loaded from them. Everything else on this site, including its fonts, comes from our own servers.
          </p>

          <h2>Stored on your device only</h2>
          <ul>
            <li>Saved Home and Work places and starred trips</li>
            <li>Your CO₂ tracker, streak and journey history</li>
            <li>A trip in progress, leave-by reminders, and your light/dark theme and map layer choices</li>
            <li>Your privacy choices</li>
            <li>For this visit only, a note that you've allowed location, so other pages don't ask again</li>
            <li>If you allow visit counting, the dates this browser was last counted (see below)</li>
          </ul>
          <p>
            These stay in your browser's storage and never reach our server. Clearing this site's data in your browser
            settings deletes them.
          </p>

          <h2>Anonymous community totals</h2>
          <p>
            When you finish a green journey, the app sends only the travel mode and distance, so we can show the total
            for everyone using the app. It contains no name, account, device ID or location.
          </p>

          <h2>Counting visitors (only if you allow it)</h2>
          <p>
            If you allow visit counting, your browser remembers the date it was last counted. When you open a page, it
            sends us only the page name and yes/no answers to “first visit today, this week, this month, or ever?”, and
            whether you're using the installed app. Our server adds these to daily totals. We don't use cookies, device
            IDs or analytics companies, and we don't store your IP address with these counts, so the numbers can't be
            linked to you or used to follow you. Browsers that send a Global Privacy Control signal are never counted.
          </p>

          <h2>Contact form</h2>
          <p>
            If you send us a message, we store your name, email address, topic and message so the admin team can read it
            and reply. Only signed-in admins can see messages. They're deleted automatically after 12 months (messages
            marked as spam after 30 days), or sooner if you ask us to delete them.
          </p>

          <h2>Admin accounts</h2>
          <p>
            For the small team who run the app, we store their name, email address, an encrypted two-factor sign-in
            secret and a securely scrambled (hashed) password. Admin actions are logged with a scrambled form of the IP
            address, to keep the admin area secure. These logs are deleted after 12 months.
          </p>

          <h2>Server logs</h2>
          <p>
            Like any website, our hosting providers record technical logs, including IP addresses, to keep the service
            secure and to stop abuse (for example, limiting how many requests one address can make). Our own logs leave
            out what you searched for. Logs are kept only as long as needed for that purpose.
          </p>

          <h2>Why we can use your data (lawful basis)</h2>
          <ul>
            <li>
              <strong>Planning journeys, location, place searches and live information:</strong> to give you the service
              you ask for, which is in our and your legitimate interests.
            </li>
            <li><strong>Maps and visit counting:</strong> your consent, which you can withdraw at any time in Your choices.</li>
            <li><strong>Contact form:</strong> our legitimate interest in answering you.</li>
            <li><strong>Security logs and admin accounts:</strong> our legitimate interest in keeping the app secure.</li>
          </ul>

          <h2>Services we use</h2>
          <ul>
            <li>
              <strong>Google Maps Platform</strong>: the home-page and trip maps, place search and journey planning. Use of
              these features is subject to the{' '}
              <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Google Maps Terms of Service</a>{' '}
              and the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
            </li>
            <li>
              <strong>OpenStreetMap</strong>: map pictures on the Live Map are loaded from OpenStreetMap's servers (see the{' '}
              <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">OpenStreetMap Foundation privacy policy</a>).
            </li>
            <li>
              <strong>Bus Open Data Service</strong> (Department for Transport): live bus positions and fares. Our server
              fetches these; your browser doesn't contact it.
            </li>
            <li>
              <strong>National Rail Enquiries</strong>: live train platforms, times and train positions. Our server
              fetches these; your browser doesn't contact it.
            </li>
            <li>
              <strong>Vercel, Render and Neon</strong>: host the website, the server and its database. The server and
              database are in Frankfurt (EU).
            </li>
          </ul>
          <p>
            Some of these companies may process data outside the UK. Where they do, they use legal safeguards such as UK
            adequacy decisions or the UK International Data Transfer Addendum.
          </p>

          <h2>Your rights</h2>
          <p>
            You have the right to ask for a copy of the personal data we hold about you, and to ask us to correct it,
            delete it, or stop or limit using it. Where we rely on your consent, you can withdraw it at any time. Most of
            what the app uses stays on your device, so you can also delete it yourself by clearing this site's data. To
            make a request, use the <Link to="/contact?topic=privacy">contact form</Link>. We'll reply within one month.
          </p>
          <p>
            If you're unhappy with how we've handled your data, please tell us first. You can also complain to the{' '}
            <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">Information Commissioner's Office (ICO)</a>.
          </p>

          <h2>Changes to this notice</h2>
          <p>
            We'll update this page if the app starts using data in a new way, and change the date at the top. Our{' '}
            <Link to="/terms">Terms of Use</Link> explain the other rules for using the app.
          </p>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import './Privacy.css';

// Update when the terms change (and say what changed at the top of the page if it matters to users)
const LAST_UPDATED = '18 October 2026';

export default function Terms() {
  return (
    <div className="page terms">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Terms of Use</h1>
          <p className="page-desc">The rules for using the Sustainable Travel Hub, in plain English. Last updated {LAST_UPDATED}.</p>
        </div>
      </section>

      <section className="section privacy-content">
        <div className="container privacy-body">
          <h2>Who we are</h2>
          <p>
            The Sustainable Travel Hub (uos-sustainable-travel.vercel.app, including the version you can install on your
            phone) is run by the University of Sunderland Developer Society. It is an independent project. It is not an
            official University of Sunderland service, and it is not run or endorsed by the University or by any transport
            operator. You can contact us using the <Link to="/contact">contact form</Link>.
          </p>
          <p>
            By using the app you agree to these terms. If you don't agree, please don't use it. The app is free, and you
            don't need an account.
          </p>

          <h2>What the app does</h2>
          <p>
            The app helps you plan greener journeys: walking, cycling, bus, Metro, train and car share. It shows routes,
            live bus and train information, fares and the CO₂ you could save, and can guide you step by step.
          </p>

          <h2>Travel information can be wrong</h2>
          <ul>
            <li>
              Routes, times, live positions, platforms and fares come from other organisations, including Google, the
              Department for Transport's Bus Open Data Service and National Rail Enquiries. They can be late, incomplete
              or wrong, and services can change or be cancelled without notice.
            </li>
            <li>Train and Metro positions on the Live Map are estimates based on live times, not GPS.</li>
            <li>
              Fares are a guide only. The price you pay is set by the operator. Check before you travel, especially for
              important journeys.
            </li>
            <li>We can't guarantee that you'll make a connection or arrive at the time shown.</li>
          </ul>

          <h2>Stay safe</h2>
          <ul>
            <li>Always follow road signs, signals, the Highway Code and instructions from transport staff, even if the app says otherwise.</li>
            <li>Don't look at or handle your phone while cycling or driving. Use the spoken directions, or stop somewhere safe first.</li>
            <li>Keep aware of your surroundings when following directions on foot, especially when crossing roads.</li>
            <li>Routes may include roads or paths that aren't suitable for you at a given time. Use your own judgement.</li>
          </ul>

          <h2>Using the app fairly</h2>
          <p>Please don't:</p>
          <ul>
            <li>use the app for anything illegal or harmful</li>
            <li>try to break, overload or get around the app's security, rate limits or admin area</li>
            <li>copy or collect data from the app in bulk with automated tools</li>
            <li>send abusive, threatening or spam messages through the contact form</li>
            <li>pretend to be someone else, or suggest that we or the University endorse you</li>
          </ul>
          <p>We may block access from anyone who breaks these rules.</p>

          <h2>Maps and other services</h2>
          <p>
            Some features use Google Maps. By using them, you also agree to the{' '}
            <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Google Maps/Google Earth Additional Terms of Service</a>{' '}
            and Google's handling of data under the{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
            The Live Map uses map data from{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>{' '}
            contributors. Live bus data comes from the Bus Open Data Service (Open Government Licence v3.0), and train
            information is powered by National Rail Enquiries. Links to other websites are for convenience; we're not
            responsible for their content.
          </p>
          <p>
            Maps only load once you allow them in your <Link to="/privacy#choices">privacy choices</Link>. Without maps,
            journeys still work as written steps.
          </p>

          <h2>Your privacy</h2>
          <p>
            Our <Link to="/privacy">Privacy Notice</Link> explains what data the app uses and your choices. It is part of
            these terms.
          </p>

          <h2>Content and names</h2>
          <p>
            The app's design, text and logo belong to the University of Sunderland Developer Society. Data from other
            organisations stays theirs and is used under their licences. Names of universities, operators and other
            organisations are used only to describe places and services, not to suggest any connection or endorsement.
          </p>

          <h2>Availability and changes</h2>
          <p>
            We run the app on a best-effort basis. It may sometimes be unavailable, slow or changed, and features may be
            added or removed. We may update these terms; the date at the top shows when they last changed. If a change
            matters to how you use the app, we'll say so on this page.
          </p>

          <h2>Our responsibility to you</h2>
          <p>
            The app is provided free of charge and "as is". As far as the law allows, we aren't responsible for losses
            caused by relying on its information, such as missed journeys, extra fares, or delays, or by the app not being
            available.
          </p>
          <p>
            Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence,
            for fraud, or for anything else that the law doesn't allow us to limit or exclude. These terms don't affect
            your legal rights as a consumer.
          </p>

          <h2>The law that applies</h2>
          <p>
            These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland, you can
            also bring a claim in your local courts. Please contact us first; we'll try to put things right.
          </p>
        </div>
      </section>
    </div>
  );
}

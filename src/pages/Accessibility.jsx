import { Link } from 'react-router-dom';
import './Privacy.css';

// Update these when the statement is reviewed or the app is re-tested
const PREPARED = '8 October 2026';
const LAST_REVIEWED = '8 October 2026';
const LAST_TESTED = '8 October 2026';

export default function Accessibility() {
  return (
    <div className="page accessibility">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Accessibility statement</h1>
          <p className="page-desc">How accessible the Sustainable Travel Hub is, what we know isn't working yet, and how to get help.</p>
        </div>
      </section>

      <section className="section privacy-content">
        <div className="container privacy-body">
          <p>
            This accessibility statement applies to the University of Sunderland Sustainable Travel Hub at
            uos-sustainable-travel.vercel.app, including the version you can install on your phone. It is run by the
            University of Sunderland Developer Society for students and staff of the University of Sunderland.
          </p>
          <p>We want as many people as possible to be able to use this website. For example, that means you should be able to:</p>
          <ul>
            <li>change colours, contrast levels and fonts using browser or device settings</li>
            <li>zoom in up to 400% without the text spilling off the screen</li>
            <li>navigate most of the website using just a keyboard or speech recognition software</li>
            <li>listen to most of the website using a screen reader</li>
            <li>use a dark theme, and have animations reduced if your device asks for less motion</li>
            <li>get every journey as a written list of steps, as well as on the map and by voice</li>
          </ul>
          <p>We've also made the website text as simple as possible to understand.</p>
          <p>
            <a href="https://mcmw.abilitynet.org.uk/" target="_blank" rel="noopener noreferrer">AbilityNet</a> has
            advice on making your device easier to use if you have a disability.
          </p>

          <h2>How accessible this website is</h2>
          <p>We know some parts of this website are not fully accessible:</p>
          <ul>
            <li>
              The interactive maps (the journey map on the home page and the Live Map) can be hard to use with a screen
              reader or keyboard alone, and some map pins sit close together and are small to tap. The same information is
              available as text: route options and every turn-by-turn step, campus details, cycle parking descriptions and
              the number of live buses.
            </li>
            <li>The positions of the live 700/701 buses are shown on the map only.</li>
            <li>The arrow showing which way you're facing is visual only. Spoken and written directions give the same guidance.</li>
            <li>Spoken directions depend on your device supporting text-to-speech. Written directions always work.</li>
            <li>
              Leave-by reminders use device notifications, which some assistive technology doesn't announce. You can add the
              reminder to your calendar instead.
            </li>
            <li>Some map controls come from Google Maps and OpenStreetMap, and we can't change how they work.</li>
          </ul>

          <h2>Feedback and contact information</h2>
          <p>
            If you need information on this website in a different format, or you find a problem not listed on this page,
            please tell us using the <Link to="/contact?topic=accessibility">contact form</Link> and choose “Accessibility”.
            We'll consider your request and aim to get back to you within 5 working days.
          </p>

          <h2>Enforcement procedure</h2>
          <p>
            The Equality and Human Rights Commission (EHRC) is responsible for enforcing the Public Sector Bodies (Websites
            and Mobile Applications) (No. 2) Accessibility Regulations 2018 (the “accessibility regulations”). If you're not
            happy with how we respond to your complaint, contact the{' '}
            <a href="https://www.equalityadvisoryservice.com/" target="_blank" rel="noopener noreferrer">
              Equality Advisory and Support Service (EASS)
            </a>.
          </p>

          <h2>Technical information about this website's accessibility</h2>
          <p>
            The University of Sunderland Developer Society is committed to making its website accessible, in accordance with
            the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.
          </p>

          <h3>Compliance status</h3>
          <p>
            This website is partially compliant with the{' '}
            <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener noreferrer">
              Web Content Accessibility Guidelines version 2.2
            </a>{' '}
            AA standard, due to the non-compliances listed below.
          </p>

          <h2>Non-accessible content</h2>
          <h3>Non-compliance with the accessibility regulations</h3>
          <ul>
            <li>
              Some map pins overlap where cycle stands are close together, so they're smaller than the minimum tap size.
              This fails WCAG 2.2 success criterion 2.5.8 (Target Size, Minimum). The same locations are listed as text below the map.
            </li>
            <li>
              Interactive maps may not be fully usable by keyboard and screen reader. This may fail WCAG 2.2 success criteria
              2.1.1 (Keyboard) and 4.1.2 (Name, Role, Value) for some map controls.
            </li>
          </ul>
          <p>We plan to fix what we can before the University takes over the service, and to review this statement at least once a year.</p>

          <h3>Content that's not within the scope of the accessibility regulations</h3>
          <p>
            Online maps and mapping services are exempt from the regulations, as long as essential information is provided in
            an accessible way for maps used for navigation. Journey options, turn-by-turn steps, stop names and campus
            information are all provided as text.
          </p>

          <h2>What we're doing to improve accessibility</h2>
          <ul>
            <li>Testing with screen readers (NVDA on Windows, VoiceOver on iPhone and Mac) and fixing what we find.</li>
            <li>Arranging an independent accessibility audit before handover to the University.</li>
            <li>Checking every new feature against WCAG 2.2 AA before it's released.</li>
          </ul>

          <h2>Preparation of this accessibility statement</h2>
          <p>
            This statement was prepared on {PREPARED}. It was last reviewed on {LAST_REVIEWED}.
          </p>
          <p>
            This website was last tested on {LAST_TESTED} against the WCAG 2.2 AA standard. The test was carried out by the
            development team. We tested the home (journey planner), Ticketing, Zones, Live Map, Sustainability, Contact,
            Privacy, Accessibility and admin sign-in pages, in light and dark themes, using automated testing (axe-core),
            keyboard-only navigation, and zooming to 400% on a narrow screen.
          </p>
        </div>
      </section>
    </div>
  );
}

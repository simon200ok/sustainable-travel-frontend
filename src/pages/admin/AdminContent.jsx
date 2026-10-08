import { useState } from 'react';
import AdminFares from './content/AdminFares';
import AdminZones from './content/AdminZones';
import AdminLocations from './content/AdminLocations';
import AdminNotes from './content/AdminNotes';

const SECTIONS = [
  { id: 'fares', label: 'Fares', Component: AdminFares },
  { id: 'zones', label: 'Zones', Component: AdminZones },
  { id: 'locations', label: 'Map locations', Component: AdminLocations },
  { id: 'notes', label: 'Page notes', Component: AdminNotes },
];

export default function AdminContent() {
  const [section, setSection] = useState('fares');
  const { Component } = SECTIONS.find((s) => s.id === section);

  return (
    <div className="admin-content">
      <div className="admin-filters admin-content-tabs" role="tablist" aria-label="Content to edit">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            className={`filter-chip ${section === s.id ? 'active' : ''}`}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="admin-muted admin-content-note">
        Changes go live on the website within about 5 minutes and are recorded in the activity log. Bus fares aren't
        edited here — they update automatically every morning from the operators' official data.
      </p>
      <Component />
    </div>
  );
}

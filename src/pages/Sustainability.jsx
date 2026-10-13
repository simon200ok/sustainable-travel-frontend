import { useMemo, useState } from "react";
import { sustainabilityTips } from "../data/travelData";
import TipModal from "../components/TipModal/TipModal";
import "./Sustainability.css";

export default function Sustainability() {
  const [activeTip, setActiveTip] = useState(null);

  const modalContent = useMemo(() => ({
    walk: {
      title: "Walk",
      body: (
        <>
          <p>
            Walking is the simplest and most sustainable way to travel. Both University campuses
            are within 15 minutes of the city centre, making walking practical and convenient.
          </p>
          <p>
            Choosing to walk reduces congestion, improves air quality, and supports your physical health, all while producing zero emissions.
          </p>
        </>
      )
    },

    cycle: {
      title: "Cycle",
      body: (
        <>
          <p>
            Cycling is a fast, low-carbon alternative for short and medium journeys. Sunderland
            provides dedicated cycle paths linking campuses and the city.
          </p>
          <p>
            It produces zero direct emissions, promotes fitness, and avoids fuel costs.
          </p>
        </>
      )
    },

    "take the metro": {
      title: "Take the Metro",
      body: (
        <>
          <p>
            The Tyne and Wear Metro is electrically powered and connects Sunderland
            across the North East efficiently.
          </p>
          <p>
            Using Metro instead of driving can reduce emissions by up to 75%,
            helping support the University’s sustainability goals.
          </p>
        </>
      )
    },

    "ride the bus": {
      title: "Ride the Bus",
      body: (
        <>
          <p>
            Modern buses produce significantly fewer emissions per passenger compared
            to individual car journeys.
          </p>
          <p>
            Regular bus services operate directly to campus,
            making them a convenient and sustainable commuting option.
          </p>
        </>
      )
    },

    "train travel": {
      title: "Train Travel",
      body: (
        <>
          <p>
            For longer journeys, rail travel is far more carbon-efficient
            than driving alone.
          </p>
          <p>
            Students can reduce costs further with railcards,
            making train travel both economical and environmentally friendly.
          </p>
        </>
      )
    },

    "car share": {
      title: "Car Share",
      body: (
        <>
          <p>
            If driving is necessary, car sharing significantly reduces
            emissions per person.
          </p>
          <p>
            Sharing rides lowers fuel costs, reduces congestion,
            and contributes to a cleaner Sunderland.
          </p>
        </>
      )
    }
  }), []);

  const handleOpen = (title) => {
    const key = title.toLowerCase();
    if (modalContent[key]) {
      setActiveTip(key);
    }
  };

  const current = activeTip ? modalContent[activeTip] : null;

  return (
    <div className="page sustainability">
      <section className="page-header sustainability-header">
        <div className="container">
          <h1 className="page-title">Sustainable Travel</h1>
          <p className="page-desc">
            Every journey matters. Small changes in how you travel to university can make a
            real difference for the environment. Explore greener ways to get around Sunderland.
          </p>
        </div>
      </section>

      <section className="section sustainability-content">
        <div className="container">
          
          <div className="impact-banner">
            <div className="impact-stat">
              <span className="impact-number">75%</span>
              <span className="impact-label">Less CO2 by taking the Metro vs driving</span>
            </div>
            <div className="impact-divider"></div>
            <div className="impact-stat">
              <span className="impact-number">60%</span>
              <span className="impact-label">Less CO2 by taking the bus vs driving</span>
            </div>
            <div className="impact-divider"></div>
            <div className="impact-stat">
              <span className="impact-number">0g</span>
              <span className="impact-label">CO2 from walking or cycling to campus</span>
            </div>
          </div>

          <h2 className="section-title">How You Can Travel Greener</h2>
          <p className="section-subtitle">
            Simple changes that save money and reduce your carbon footprint.
          </p>

          <div className="tips-grid">
            {sustainabilityTips.map((tip, i) => (
              <div
                key={i}
                className="tip-card tip-card-clickable"
                role="button"
                tabIndex={0}
                onClick={() => handleOpen(tip.title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleOpen(tip.title);
                  }
                }}
              >
                <span className="tip-icon">{tip.icon}</span>
                <h3>{tip.title}</h3>
                <p>{tip.description}</p>
                <div className="tip-co2">
                  <span className="co2-badge">{tip.co2Saved}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="why-section">
            <div className="why-content">
              <h2>Why Sustainable Travel Matters</h2>
              <p>
                Transport is one of the largest sources of carbon emissions in the UK. By choosing public
                transport, cycling, or walking, university students can collectively make a significant
                impact on reducing emissions in the North East.
              </p>
              <p>
                The University of Sunderland is committed to sustainability. The Sustainability Team
                works to promote greener choices and reduce the university's environmental impact. Your
                travel choices are a key part of this mission.
              </p>
              <div className="why-stats">
                <div className="why-stat-item">
                  <span className="why-stat-number">27%</span>
                  <span className="why-stat-text">of UK CO2 emissions come from transport</span>
                </div>
                <div className="why-stat-item">
                  <span className="why-stat-number">1 bus</span>
                  <span className="why-stat-text">can replace up to 50 car journeys</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pledge-card">
            <h2>Make the Pledge</h2>
            <p>
              Commit to using sustainable transport at least 3 days a week. Whether it's walking,
              cycling, Metro, bus, or train, every green journey counts toward a cleaner Sunderland.
            </p>
            <div className="pledge-options">
              <div className="pledge-option">
                <span>🚶</span>
                <span>Walk</span>
              </div>
              <div className="pledge-option">
                <span>🚲</span>
                <span>Cycle</span>
              </div>
              <div className="pledge-option">
                <span>🚇</span>
                <span>Metro</span>
              </div>
              <div className="pledge-option">
                <span>🚌</span>
                <span>Bus</span>
              </div>
              <div className="pledge-option">
                <span>🚂</span>
                <span>Train</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TipModal
        isOpen={!!current}
        title={current?.title}
        onClose={() => setActiveTip(null)}
      >
        {current?.body}
      </TipModal>

    </div>
  );
}

//Old code without Tipmodal implementation:
// import { sustainabilityTips } from '../data/travelData';
// import './Sustainability.css';

// export default function Sustainability() {
//   return (
//     <div className="page sustainability">
//       <section className="page-header sustainability-header">
//         <div className="container">
//           <h1 className="page-title">Sustainable Travel</h1>
//           <p className="page-desc">
//             Every journey matters. Small changes in how you travel to university can make a
//             real difference for the environment. Explore greener ways to get around Sunderland.
//           </p>
//         </div>
//       </section>

//       <section className="section sustainability-content">
//         <div className="container">
//           <div className="impact-banner">
//             <div className="impact-stat">
//               <span className="impact-number">75%</span>
//               <span className="impact-label">Less CO2 by taking the Metro vs driving</span>
//             </div>
//             <div className="impact-divider"></div>
//             <div className="impact-stat">
//               <span className="impact-number">60%</span>
//               <span className="impact-label">Less CO2 by taking the bus vs driving</span>
//             </div>
//             <div className="impact-divider"></div>
//             <div className="impact-stat">
//               <span className="impact-number">0g</span>
//               <span className="impact-label">CO2 from walking or cycling to campus</span>
//             </div>
//           </div>

//           <h2 className="section-title">How You Can Travel Greener</h2>
//           <p className="section-subtitle">
//             Simple changes that save money and reduce your carbon footprint.
//           </p>

//           <div className="tips-grid">
//             {sustainabilityTips.map((tip, i) => (
//               <div key={i} className="tip-card">
//                 <span className="tip-icon">{tip.icon}</span>
//                 <h3>{tip.title}</h3>
//                 <p>{tip.description}</p>
//                 <div className="tip-co2">
//                   <span className="co2-badge">{tip.co2Saved}</span>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="why-section">
//             <div className="why-content">
//               <h2>Why Sustainable Travel Matters</h2>
//               <p>
//                 Transport is one of the largest sources of carbon emissions in the UK. By choosing public
//                 transport, cycling, or walking, university students can collectively make a significant
//                 impact on reducing emissions in the North East.
//               </p>
//               <p>
//                 The University of Sunderland is committed to sustainability. The Sustainability Team
//                 works to promote greener choices and reduce the university's environmental impact. Your
//                 travel choices are a key part of this mission.
//               </p>
//               <div className="why-stats">
//                 <div className="why-stat-item">
//                   <span className="why-stat-number">27%</span>
//                   <span className="why-stat-text">of UK CO2 emissions come from transport</span>
//                 </div>
//                 <div className="why-stat-item">
//                   <span className="why-stat-number">1 bus</span>
//                   <span className="why-stat-text">can replace up to 50 car journeys</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="pledge-card">
//             <h2>Make the Pledge</h2>
//             <p>
//               Commit to using sustainable transport at least 3 days a week. Whether it's walking,
//               cycling, Metro, bus, or train — every green journey counts toward a cleaner Sunderland.
//             </p>
//             <div className="pledge-options">
//               <div className="pledge-option">
//                 <span>🚶</span>
//                 <span>Walk</span>
//               </div>
//               <div className="pledge-option">
//                 <span>🚲</span>
//                 <span>Cycle</span>
//               </div>
//               <div className="pledge-option">
//                 <span>🚇</span>
//                 <span>Metro</span>
//               </div>
//               <div className="pledge-option">
//                 <span>🚌</span>
//                 <span>Bus</span>
//               </div>
//               <div className="pledge-option">
//                 <span>🚂</span>
//                 <span>Train</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

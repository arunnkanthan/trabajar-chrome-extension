import { CopyButton } from './components/CopyButton'
import { JobForm } from './components/JobForm'
import './App.css'

const config = {
  LinkedIn: {
    label: 'LinkedIn',
    text: 'https://www.linkedin.com/in/arunnkanthan/',
    icon: '💼'
  },
  github: {
    label: 'GitHub',
    text: 'https://www.github.com/arunnkanthan/',
    icon: '🐙'
  },
  project: {
    label: 'Project',
    text: 'During my time at Impress (Uniform Teeth), I led the integration of Zendesk into the Electronic Medical Record (EMR) system. Impress is an orthodontic care startup focusing on clear aligner treatments. The problem we aimed to solve was to improve patient communication and address any issues or hesitations patients had before entering the clinic and during their appointment. I led a team of three engineers, along with a product manager, designer, and our stakeholders: the CEO (who led the orthodontic team) and the Director of Customer Care. This Zendesk integration involved setting up both production and QA environments, connecting Zendesk to a new microservice via a webhook created in Go, and developing a chat tab within the EMR for every patient, as well as within the patient app. This allowed patients to send messages to their clinic. The chat tab experience displayed messages in a timeline format, differentiating between SMS, email, or app messages from patients, the clinic, or anyone using Zendesk along with author of the message. I primarily focused on creating the microservice, handling the Zendesk integration, and assisted the frontend engineers creating the UI. Two engineers concentrated on the EMR chat tab experience, while the third engineer worked on the chat tab experience within the mobile patient app. The project timeline was about one quarter, including testing and development and training for our orthodontic and customer care teams on how to use Zendesk. We measured success through NPS surveys from our patients by an increase of 25%. They reported that the new chat experience prior to their first appointment helped them start and continue treatment with Impress more confidently compared to patients who were hesitant or chose not to proceed with treatment before the integration.',
    icon: '💻',
  },
  "Why this company": {
    label: 'Why us',
    text: "I'm a software engineer, who's language agnostic, with 8 years of full stack experience including 3 years of leading and mentoring junior engineers. Most of my professional experience has been in startups and I'm looking for new opportunities in that space. I'm comfortable in fast paced environments, and enjoy collaborating with other engineers, product teams, design teams and other organizations within the company.",
    icon: '💬',
  }
}

const configButtons = () => {
  return Object.entries(config).map(([linkKey, linkValue]) => {
    return (
      <CopyButton
        key={linkKey}
        id={linkKey}
        label={linkValue.label}
        title={`Copy ${linkKey}`}
        text={linkValue.text}
        icon={linkValue.icon}
      />
    )
  })
}


function App() {
  return (
    <div className="app">
      <div className="container">
        <h2 className="title">Trabajar</h2>
        <div className="button-container">
         {configButtons()}
        </div>
        <JobForm />
      </div>
    </div>
  )
}

export default App
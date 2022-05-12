import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
// import { withAuthenticator } from '@aws-amplify/ui-react';
import { listNomads } from './graphql/queries';
import { createNomad as createNomadMutation, deleteNomad as deleteNomadMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [nomads, setNomads] = useState([]);
  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchNomads();
  }, []);

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNomads();
  }

  async function fetchNomads() {
    const apiData = await API.graphql({ query: listNomads });
    const nomadsFromAPI = apiData.data.listNomads.items;
    await Promise.all(nomadsFromAPI.map(async nomad => {
      if (nomad.image) {
        const image = await Storage.get(nomad.image);
        nomad.image = image;
      }
      return nomad;
    }))
    setNomads(apiData.data.listNomads.items);
  }

  async function createNomad() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNomadMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNomads([ ...nomads, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNomad({ id }) {
    const newNomadsArray = nomads.filter(nomad => nomad.id !== id);
    setNomads(newNomadsArray);
    await API.graphql({ query: deleteNomadMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <h1>My Nomads App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Nomad name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Nomad description"
        value={formData.description}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createNomad}>Create Nomad</button>
      <div style={{marginBottom: 30}}>
        {
          nomads.map(nomad => (
            <div key={nomad.id || nomad.name}>
              <h2>{nomad.name}</h2>
              <p>{nomad.description}</p>
              <button onClick={() => deleteNomad(nomad)}>Delete nomad</button>
              {
                nomad.image && <img src={nomad.image} alt={nomad.description} style={{width: 400}} />
              }
            </div>
          ))
        }
      </div>
    </div>
  );
}

// export default withAuthenticator(App);
export default App;

// import React from 'react';
// import './App.css';
// import { Authenticator } from '@aws-amplify/ui-react';
// import '@aws-amplify/ui-react/styles.css';

// function App() {
//   return (
//     <div style={{
//         position: 'absolute', left: '50%', top: '40%',
//         transform: 'translate(-50%, -50%)'
//     }}>
//       <Authenticator>
//       {({ signOut, user }) => (
//         <div className="App">
//           <p>
//             Hey {user.username}, welcome to my channel, with auth!
//           </p>
//           <button onClick={signOut}>Sign out</button>
//         </div>
//       )}
//       </Authenticator>
//     </div>
//   );
// }

// export default App;
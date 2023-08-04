import logo from './logo.svg';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import {
  withAuthenticator,
  Button,
  Heading,
  Image,
  View,
  Card,
  TextField,
  Flex,
  Text,
} from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries'
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from './graphql/mutations';
import { useEffect, useState } from 'react';
import { API, Storage } from 'aws-amplify';

function App({ signOut }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes()
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;

    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    )
    console.log(notesFromAPI);

    setNotes(notesFromAPI);

    console.log(notes);
  };

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get('image');
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
    };

    if (!!data.image) await Storage.put(data.name, image);

    await API.graphql({
      query: createNoteMutation,  //send mutation to graqhlQl api
      variables: { input: data },
    });

    fetchNotes();
    event.target.reset();
  };

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);

    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  };

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>

      <View
        name='image'
        as="input"
        type="file"
        style={{ alignSelf: 'end' }}
      />

      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Note name"
            label="Note name"
            labelHidden
            variation='quiet'
            required
          />
          <TextField
            name='description'
            placeholder="Note description"
            label="Note description"
            labelHidden
            variation='quiet'
            required
          />
          <Button type="submit" variation='primary'>
            Create Note
          </Button>
        </Flex>
      </View>

      <Heading level={2}>Current Notes</Heading>
      <View margin="3rem 0">
        {notes.map((note) => (
          <Flex
            key={note.id || note.name}
            direction='row'
            justifyContent='center'
            alignItems='center'
          >
            <Text as="strong" fontWeight={700}>
              {note.name}
            </Text>
            <Text as="span">{note.description}</Text>
            {
              note.image && (
                <Image
                  src={note.image}
                  alt={`visual aid for ${notes.name}`}
                  style={{ width: 400 }}
                />
              )
            }
            <Button variation='link' onClick={() => deleteNote(note)}>
              Delete Note
            </Button>
          </Flex>
        ))}
      </View>

      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
}

export default withAuthenticator(App);

import ftl from '@fluent/dedent';
import { createMemoryHistory } from 'history';
import React, { useContext } from 'react';
import { act } from 'react-dom/test-utils';

import { createReduxStore, mountComponentWithStore } from '~/test/store';
import { parseEntry } from '~/utils/message';

import { EditorData, EditorProvider, useClearEditor } from './Editor';
import { EntityView, EntityViewProvider } from './EntityView';
import { Locale } from './Locale';
import { Location, LocationProvider } from './Location';

function mountSpy(Spy, format, translation) {
  const history = createMemoryHistory({
    initialEntries: [`/sl/pro/all/?string=42`],
  });

  const initialState = {
    entities: {
      entities: [
        {
          pk: 42,
          format,
          original: 'key = test',
          translation: [{ string: translation, errors: [], warnings: [] }],
          project: { contact: '' },
          comment: '',
        },
        {
          pk: 13,
          format: 'simple',
          original: 'original',
          original_plural: 'original plural',
          translation: [
            { string: 'one', errors: [], warnings: [] },
            { string: 'other', errors: [], warnings: [] },
          ],
          project: { contact: '' },
          comment: '',
        },
      ],
    },
    otherlocales: { translations: [] },
    user: {
      isAuthenticated: true,
      settings: { forceSuggestions: true },
      username: 'Franck',
    },
  };
  const store = createReduxStore(initialState);

  const Wrapper = () => (
    <LocationProvider history={history}>
      <Locale.Provider value={{ code: 'sl', cldrPlurals: [1, 2, 3, 5] }}>
        <EntityViewProvider>
          <EditorProvider>
            <Spy />
          </EditorProvider>
        </EntityViewProvider>
      </Locale.Provider>
    </LocationProvider>
  );
  return mountComponentWithStore(Wrapper, store, {}, history);
}

describe('<EditorProvider>', () => {
  it('provides a simple non-Fluent value', () => {
    let editor;
    const Spy = () => {
      editor = useContext(EditorData);
      return null;
    };
    mountSpy(Spy, 'simple', 'message');
    expect(editor).toMatchObject({
      format: 'simple',
      initial: 'message',
      value: 'message',
      view: 'simple',
    });
  });

  it('provides a simple Fluent value', () => {
    let editor;
    const Spy = () => {
      editor = useContext(EditorData);
      return null;
    };
    mountSpy(Spy, 'ftl', 'key = message');
    expect(editor).toMatchObject({
      format: 'ftl',
      initial: 'key = message\n',
      value: 'message',
      view: 'simple',
    });
  });

  it('provides a rich Fluent value', () => {
    let editor;
    const Spy = () => {
      editor = useContext(EditorData);
      return null;
    };
    const initial = ftl`
      key =
          { $var ->
              [one] ONE
             *[other] OTHER
          }

      `;
    mountSpy(Spy, 'ftl', initial);

    const value = parseEntry(initial);
    expect(editor).toMatchObject({
      format: 'ftl',
      initial,
      value,
      view: 'rich',
    });
  });

  it('provides a forced source Fluent value', () => {
    let editor;
    const Spy = () => {
      editor = useContext(EditorData);
      return null;
    };
    const value = '## comment\n';
    mountSpy(Spy, 'ftl', value);

    expect(editor).toMatchObject({
      format: 'ftl',
      initial: value,
      value,
      view: 'source',
    });
  });

  it('updates state on entity and plural form changes', () => {
    let editor;
    let location;
    let entity;
    const Spy = () => {
      editor = useContext(EditorData);
      location = useContext(Location);
      entity = useContext(EntityView);
      return null;
    };
    const wrapper = mountSpy(Spy, 'simple', 'translated');

    act(() => location.push({ entity: 13 }));
    wrapper.update();

    expect(editor).toMatchObject({
      format: 'simple',
      initial: 'one',
      value: 'one',
      view: 'simple',
    });

    act(() => entity.setPluralForm(1));
    wrapper.update();

    expect(editor).toMatchObject({
      format: 'simple',
      initial: 'other',
      value: 'other',
      view: 'simple',
    });
  });
});

describe('useClearEditor', () => {
  it('clears a rich Fluent value', () => {
    let editor;
    let clearEditor;
    const Spy = () => {
      editor = useContext(EditorData);
      clearEditor = useClearEditor();
      return null;
    };
    const initial = ftl`
      key =
          { $var ->
              [one] ONE
             *[other] OTHER
          }

      `;
    const wrapper = mountSpy(Spy, 'ftl', initial);
    act(() => clearEditor());
    wrapper.update();

    expect(editor).toMatchObject({
      format: 'ftl',
      initial,
      value: {
        id: 'key',
        value: {
          type: 'select',
          declarations: [],
          selectors: [{ type: 'variable', name: 'var' }],
          variants: [
            { keys: [{ type: 'nmtoken', value: 'one' }], value: { body: [] } },
            { keys: [{ type: 'nmtoken', value: 'two' }], value: { body: [] } },
            { keys: [{ type: 'nmtoken', value: 'few' }], value: { body: [] } },
            { keys: [{ type: '*' }], value: { body: [] } },
          ],
        },
      },
      view: 'rich',
    });
  });
});

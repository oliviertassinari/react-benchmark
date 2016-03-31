import React from 'react';
import ReactDOM from 'react-dom';
import Benchmark from 'benchmark';
import instrument from './instrument';
import Component from './Component';

const type = 'benchmark';

switch (type) {
  case 'instrument':
    const Instrument = instrument(Component, (step) => {
      return {};
    });

    ReactDOM.render(<Instrument />, document.getElementById('example'));
    break;

  case 'benchmark':
    const bench = new Benchmark({
      name: 'render',
      minSamples: 100,
      async: true,
      fn() {
        var mountNode = document.getElementById('example');
        ReactDOM.render(<Component />, mountNode);
        ReactDOM.unmountComponentAtNode(mountNode);
      },
      onComplete(event) {
        alert(String(event.target));
      }
    }).run();
    break;
}


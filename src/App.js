import React, { Component } from 'react';
import { Container, Row, Col, Hidden } from 'react-grid-system';
import dateFormat from 'dateformat';
import { Doughnut } from 'react-chartjs-2';

import pollData from './poll.json';
import './css/style.css';

const backendUrl = 'http://localhost:9000';

const PollingWrapper = ({content, onVote}) => {
  const choices = [];
  const labels = [];
  const labelsData = [];
  for (let i = 0; i < content.answer.options.length; i++) {
    const option = content.answer.options[i];
    choices.push(
      <a data-value={option.id} key={`choice${i}`} onClick={() => onVote(option.id)}>
        {option.label}
      </a>);
    labels.push(option.label);
    
    const voteCount = content.choice[option.id];
    (Number.isInteger(voteCount)) ? labelsData.push(voteCount) : labelsData.push(0);
  }

  const chatData = {
    labels: labels,
    datasets: [{
      data: labelsData,
      backgroundColor: [
        "red",
        "green",
        "purple",
        "blue",
        "orange",
        "black",
      ],
    }],
  };
  const pieChart = <Doughnut data={chatData} />;

  return (
    <div>
      <h2>Today&#39;s Poll</h2>
      <p className="date">{content.date}</p>
      <p className="title">{content.title}</p>
      <div className="choice-wrapper">
        {choices}
      </div>
      <p className="total-votes">Total number of votes recorded: {content.total}</p>
      <div className="chart">{pieChart}</div>
    </div>
  );
}

const PollingItem = ({content}) => {
  return (
    <div>
      <Hidden xs sm>
        <Col md={3} className="chart-wrapper">
          <div className="chart"></div>
        </Col>
      </Hidden>
      <Col md={9} className="content-wrapper">
        <p className="date">{content.date}</p>
        <p className="title">{content.title}</p>
      </Col>
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);

    this.pollResults = {};
    this.state = {
      currentQuestion: 0,
      total: 0,
      choice: {},
      isOnline: true,
    };

    fetch(`${backendUrl}/count`, {}).then(res => res.json())
      .then((results) => {
        let total = 0;
        const choice = {};
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result._id.question === (this.state.currentQuestion + 1)) {
            total += result.total;
            choice[result._id.choice] = result.total;
          }
        }

        this.pollResults = results;
        this.setState({
          total,
          choice,
        });
      }).catch((err) => {
        this.setState({
          isOnline: false,
        });
        alert('Cannot connect to backend');
      });
  }

  _onVote = (choice) => {
    if (!this.state.isOnline) {
      alert('Cannot connect to backend');
      return;
    }

    fetch(`${backendUrl}/poll`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: this.state.currentQuestion + 1,
        choice: choice,
      })
    });

    if (this.state.currentQuestion < pollData.polls.length - 1) {
      let total = 0;
      const choice = {};
      for (let i = 0; i < this.pollResults.length; i++) {
        const pollResult = this.pollResults[i]
        if (pollResult._id.question === (this.state.currentQuestion + 2)) {
          total += pollResult.total;
          choice[pollResult._id.choice] = pollResult.total;
        }
      }

      this.setState({
        total,
        choice,
        currentQuestion: this.state.currentQuestion + 1,
      });
    } else {
      alert('Thank you for your poll');
      window.location.reload();
    }
  };

  render = () => {
    const pollingItems = [];
    for (let i = 0; i < pollData.polls.length; i++) {
      if (i > this.state.currentQuestion) {
        const date = new Date(pollData.polls[i].publishedDate * 1000);
        const dateWithFormat = dateFormat(date, "dd mmm yyyy");

        const content = {
          date: dateWithFormat,
          title: pollData.polls[i].title,
        };

        pollingItems.push(
          <Col sm={6} className="pollingItem" key={i}>
            <PollingItem content={content}/>
          </Col>
        );
      }
    }

    const date = new Date(pollData.polls[this.state.currentQuestion].publishedDate * 1000);
    const dateWithFormat = dateFormat(date, "dddd, dS mmmm, yyyy, h:MMTT");
    const pollingWrapperContent = {
      date: dateWithFormat,
      title: pollData.polls[this.state.currentQuestion].title,
      answer: pollData.polls[this.state.currentQuestion].answer,
      total: this.state.total,
      choice: this.state.choice,
    };

    return (
      <Container>
        <Row>
          <Col sm={12} className="pollingWrapper">
            <PollingWrapper content={pollingWrapperContent} onVote={this._onVote}/>
          </Col>
          {pollingItems}
        </Row>
      </Container>
    );
  };
}

export default App;

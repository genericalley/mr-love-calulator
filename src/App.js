import React, { useEffect, useState } from 'react';
import { find, sortBy } from 'lodash';

import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';

import expertInfo from './experts';

const initialExperts = Object.entries(expertInfo.experts)
  .filter(pair => (pair[1].obtain === 'Story'))
  .map(pair => pair[0]);

const allExperts = Object.entries(expertInfo.experts)
  .map(pair => pair[0]).sort();

const calculateGainPerExpert = (selected) => {
  const currentNormal = getStageStates(selected, expertInfo.stages.normal);
  const currentElite = getStageStates(selected, expertInfo.stages.elite);

  return allExperts.map(expert => {
    if (selected.includes(expert)) {
      return ({ id: expert, owned: true });
    }

    const newNormal = getStageStates(selected.concat(expert), expertInfo.stages.normal);
    const newElite = getStageStates(selected.concat(expert), expertInfo.stages.elite);

    return ({
      id: expert,
      normalGain: newNormal.filter(stage => find(currentNormal, cStage => cStage.id === stage.id && cStage.status < stage.status)),
      eliteGain: newElite.filter(stage => find(currentElite, cStage => cStage.id === stage.id &&  cStage.status < stage.status)),
    });
  });
};

const getStageStates = (have, stages) => (stages.map(({ id, reqs }) => {
  const satisfied = reqs.filter(req => (
    find(Object.entries(expertInfo.experts), expertAry => (
      have.includes(expertAry[0]) &&
      (req[0] === null || expertAry[1].genres.includes(req[0])) &&
      (req[1] === null || expertAry[1].traits.includes(req[1]))
    ))
  ));
  let status = 0;
  if (satisfied.length === reqs.length) {
    status = 2;
  } else if (satisfied.length === 1 && reqs.length === 2) {
    status = 1;
  }
  return {id, status};
}));

const Trait = ({ id }) => (
  <Chip
    label={expertInfo.traits[id].id}
    style={{ backgroundColor: expertInfo.traits[id].color }}
  />
);

const stageStyle = { backgroundColor: '#efefef', borderRadius: '4px', marginBottom: '.5rem' };

const Stage = ({ stage, difficulty }) => (
  <ListItem style={stageStyle}>
    <Typography style={{ fontWeight: 'bold' }}>{stage.id}</Typography>
    <br />
    <List>
      {find(expertInfo.stages[difficulty], s => s.id === stage.id).reqs.map((req, idx) => (
        <ListItem key={`${req[0]}, ${req[1]}, ${idx}`}>
          {req[0] !== null && expertInfo.genres[req[0]]+ ' | '}
          {req[1] !== null && <Trait id={req[1]} />}
        </ListItem>
      ))}
    </List>
  </ListItem>
);

const ExpertSelect = () => {
  const [selected, setSelected] = useState(initialExperts);
  const [gains, setGains] = useState([]);

  useEffect(() => {
    const newGains = calculateGainPerExpert(selected);
    setGains(newGains);
  }, [selected]);

  const selectExpert = (event) => {
    const expert = event.target.value;
    if (selected.includes(expert)) {
      setSelected(selected.filter(other => other !== expert));
    } else {
      setSelected(selected.concat(expert));
    }
  };

  const topExperts = sortBy(gains, expert => -1 *((expert.normalGain || []).length + (expert.eliteGain || []).length));

  return (
    <>
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Please check all experts you currently possess</Typography>
        </Grid>
        {allExperts.map(expertId => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={expertId}>
            <FormControlLabel
              control={<Checkbox onChange={selectExpert} />}
              label={<Typography>{expertId}</Typography>}
              value={expertId}
              checked={selected.includes(expertId)}
            />
          </Grid>
        ))}
      </Grid>
      <Divider />
      <Grid item xs={12} style={{ textAlign: 'center' }}>
        <Typography style={{ fontSize: '24px', fontWeight: 'bold' }}>I recommend...</Typography>
      </Grid>
      {topExperts.map((expert, idx) => (
        <Grid container item direction='row' spacing={2} key={expert.id}>
          <Grid item xs={12} md={4}>
            <Typography style={{ fontWeight: 'bold' }}>{expert.id}</Typography>
            <Typography>
              {expertInfo.experts[expert.id].obtain !== 'Story' ?
                (<>
                  {expertInfo.experts[expert.id].cost} medals<br />
                  Requires {expertInfo.experts[expert.id].obtain} investigator level
                </>) :
                'Given automatically by completing story missions'
              }
            </Typography>
            {idx === 0 && <div style={{ color: 'gold', size: '3rem', fontWeight: 'bold' }}> 1st ♕</div>}
            {idx === 1 && <div style={{ color: 'silver', size: '3rem', fontWeight: 'bold' }}> 2nd ♕</div>}
            {idx === 2 && <div style={{ color: 'peru', size: '3rem', fontWeight: 'bold' }}> 3rd♕</div>}
            <div>{expertInfo.experts[expert.id].genres.map(g => expertInfo.genres[g]).join(' | ')}</div>
            {expertInfo.experts[expert.id].traits.map(t => (<Trait key={t} id={t} />))}
          </Grid>
          {expert.owned ? (
            <Grid item xs={12} md={8}><Typography>You have this expert.</Typography></Grid>
          ) : (
            (expert.normalGain.length + expert.eliteGain.length) === 0 ? (
              <Grid item xs={12} md={8}><Typography>You would gain nothing by obtaining this expert.</Typography></Grid>
            ) : (
              <>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography style={{ fontStyle: 'italic' }}>Satisfies normal stages:</Typography>
                  <List>
                    {expert.normalGain.map(stage => (
                      <Stage key={stage.id} stage={stage} difficulty='normal'/>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography style={{ fontStyle: 'italic' }}>Satisfies elite stages:</Typography>
                  <List>
                    {expert.eliteGain.map(stage => (
                      <Stage key={stage.id} stage={stage} difficulty='elite'/>
                    ))}
                  </List>
                </Grid>
              </>
            )
          )}
          <Grid item xs={12}>
            <Divider />
          </Grid>
        </Grid>
      ))}
      </>
  );
};

function App() {
  return (
    <>
      <AppBar position='sticky'>
        <Toolbar>
          Mr. Love - Expert Calculator
        </Toolbar>
      </AppBar>
      <Container style={{ paddingTop: '1rem' }}>
        <Grid container direction='column' spacing={2}>
          <ExpertSelect />
        </ Grid>
      </Container>
    </>
  );
}

export default App;

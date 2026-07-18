# Contributing

Feedback, criticism and contributions are welcome. This document explains what happens
to what you send, in plain terms and without hiding the awkward part.

## Current status

This project is **pre-release**. See [LICENSE](LICENSE): all rights are reserved and no
open-source license has been granted yet. The repository is public so the work can be
read and discussed while it is being built, not because it is open source today.

An open license is intended once the design stabilises. It has not been chosen yet, on
purpose: a permissive license is effectively irreversible, so deferring is the reversible
move.

## What is most useful

In rough order of value:

1. **Telling us we are wrong.** A concrete, checkable objection — a claim that does not
   hold, a number that does not reproduce, a benchmark that measures something other than
   what it says — is worth more than agreement. It is also literally one of the behaviours
   this project is trying to build into a model, so it would be odd to discourage it here.
2. **Reproduction failures.** If something documented does not do what it says on your
   machine, that is a finding. Include what you ran and what you got.
3. **Design critique** of the training taxonomy or the harness.
4. **Code and data.** See the grant below first.

Open an issue at <https://github.com/0Franky/sml/issues>. For anything larger than a small
fix, open the issue *before* writing the code — the design may already be decided or
deliberately deferred, and it would be a waste of your time.

## The contributor grant — and why it exists

By submitting a contribution (code, documentation, training data, or any other material)
you confirm that:

1. **You wrote it, or you have the right to submit it.** It is not under an incompatible
   licence, not subject to an employer's claim, and not copied from a source that forbids
   it. For training data this matters more than usual: state the provenance and the licence
   of anything you did not author yourself.
2. **You grant the copyright holder a perpetual, worldwide, irrevocable, royalty-free
   licence** to use, reproduce, modify, publish, sublicense and distribute your
   contribution, **including the right to release it under a different licence** later —
   which may be an open-source licence, a commercial licence, or both.

**Why this asks a lot, stated plainly.** Without the right to relicense, every contribution
accepted would lock the licence choice as it stands today, and a project that cannot choose
its future licence has effectively already chosen. That is the whole reason for the clause.
It also means the copyright holder could, in principle, use your contribution commercially.
That is a real asymmetry and you should decide with it in view rather than discover it later.

**What you keep**: authorship and attribution. Contributions are credited, and the git
history is not rewritten to remove them.

If the grant is not acceptable to you, an issue describing the problem — or a patch posted
in the issue for someone else to reimplement — is still genuinely useful, and welcome.

## On reciprocity

The intent for the eventual licence is that people who build on this give something back,
rather than only taking. How that is expressed in legal terms is not settled — the honest
position today is that it is an intention, not an enforceable obligation, and it will not
be presented as one until it actually is.

## Ground rules

- **No secrets, no personal data.** Never include API keys, tokens, credentials, absolute
  paths containing usernames, or anyone's personal information — this repository is public
  and its history is permanent. Contributions containing them will be rejected rather than
  cleaned up.
- **Claims carry their evidence.** A statement about behaviour, performance or correctness
  should say how it was measured and on what. A percentage without its denominator is not
  a measurement.
- **Say what you did not check.** An honest "I verified X but not Y" is more useful than
  implied completeness, and it will not be held against you.

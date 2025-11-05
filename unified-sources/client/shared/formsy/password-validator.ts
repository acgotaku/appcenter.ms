export class PasswordValidator {
  private UPPER_CASE_REGEX = /[A-Z]/;
  private LOWER_CASE_REGEX = /[a-z]/;
  private DEFAULT_PRINCIPLES = {
    principles: [
      {
        label: "at least 8 characters",
        predicate: (password: string) => password.length >= 8,
      },
      {
        label: "one upper case character",
        predicate: (password: string) => password.match(this.UPPER_CASE_REGEX) !== null,
      },
      {
        label: "one lower case character",
        predicate: (password: string) => password.match(this.LOWER_CASE_REGEX) !== null,
      },
    ],
  };

  public validate(password: string): boolean {
    const principlesCompleted = this.DEFAULT_PRINCIPLES.principles
      .map((p, index) => {
        return p.predicate(password);
      })
      .reduce((count, satisfied) => count + (satisfied ? 1 : 0), 0);
    const percentCompleted = (principlesCompleted / this.DEFAULT_PRINCIPLES.principles.length) * 100.0;
    return percentCompleted === 100.0;
  }
}
